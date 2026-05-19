import { stripe } from '@/lib/stripe'
import { syncSubscriptionEntitlement } from '@/lib/subscription-server'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: Request) {
  const body = await req.text()
  const headerList = await headers()
  const signature = headerList.get('stripe-signature') as string

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Invalid webhook signature'
    console.error(`Webhook Error: ${message}`)
    return NextResponse.json(
      { error: `Webhook Error: ${message}` },
      { status: 400 }
    )
  }

  const supabase = createServiceClient()

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const userId = session.metadata?.userId
    const stripeCustomerId = session.customer as string
    const stripeSubscriptionId =
      typeof session.subscription === 'string'
        ? session.subscription
        : session.subscription?.id

    if (userId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('pending_referral_credits')
        .eq('id', userId)
        .single()

      if (profile?.pending_referral_credits && profile.pending_referral_credits > 0) {
        try {
          const totalCredit = profile.pending_referral_credits * 1999

          await stripe.customers.createBalanceTransaction(stripeCustomerId, {
            amount: -totalCredit,
            currency: 'gbp',
            description: `Banked Referral Credits: ${profile.pending_referral_credits} months applied`,
          })

          await supabase
            .from('profiles')
            .update({ pending_referral_credits: 0 })
            .eq('id', userId)

          console.log(`Applied ${profile.pending_referral_credits} banked credits to user ${userId}`)
        } catch (creditErr) {
          console.error('Error applying banked credits:', creditErr)
        }
      }

      await syncSubscriptionEntitlement({
        source: 'webhook',
        eventType: event.type,
        userId,
        stripeCustomerId,
        stripeSubscriptionId,
      })
    } else {
      console.error('Missing metadata.userId on checkout.session.completed', {
        stripeCustomerId,
        stripeSubscriptionId,
      })
    }
  }

  if (
    event.type === 'customer.subscription.created' ||
    event.type === 'customer.subscription.updated' ||
    event.type === 'customer.subscription.deleted'
  ) {
    const subscription = event.data.object as Stripe.Subscription
    const stripeCustomerId = subscription.customer as string

    await syncSubscriptionEntitlement({
      source: 'webhook',
      eventType: event.type,
      stripeCustomerId,
      stripeSubscriptionId: subscription.id,
    })
  }

  if (event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object as Stripe.Invoice
    const stripeCustomerId = invoice.customer as string

    if ((invoice as Stripe.Invoice & { subscription?: string | null }).subscription && stripeCustomerId) {
      const { data: referee } = await supabase
        .from('profiles')
        .select('id, referred_by, referral_rewarded')
        .eq('stripe_customer_id', stripeCustomerId)
        .single()

      if (referee?.referred_by && !referee.referral_rewarded) {
        const { data: referrer } = await supabase
          .from('profiles')
          .select('id, stripe_customer_id, referral_count, pending_referral_credits')
          .eq('id', referee.referred_by)
          .single()

        if (referrer && (referrer.referral_count || 0) < 5) {
          try {
            if (referrer.stripe_customer_id) {
              await stripe.customers.createBalanceTransaction(referrer.stripe_customer_id, {
                amount: -1999,
                currency: 'gbp',
                description: 'Referral Reward: 1 Free Month',
              })

              await supabase.rpc('increment_referral_count', { user_id: referrer.id })
            } else {
              await supabase.rpc('bank_referral_credit', { user_id: referrer.id })
            }

            await supabase
              .from('profiles')
              .update({ referral_rewarded: true })
              .eq('id', referee.id)

            console.log(`Referral reward processed: ${referrer.id} credited for ${referee.id}`)
          } catch (stripeErr) {
            console.error('Error processing referral reward:', stripeErr)
          }
        }
      }
    }
  }

  if (event.type === 'invoice.payment_failed') {
    const invoice = event.data.object as Stripe.Invoice
    const stripeCustomerId = invoice.customer as string

    if (stripeCustomerId) {
      console.error(`Payment failed for customer: ${stripeCustomerId}`)
    }
  }

  return NextResponse.json({ received: true })
}
