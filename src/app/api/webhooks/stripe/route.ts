import { stripe } from '@/lib/stripe'
import { syncSubscriptionEntitlement } from '@/lib/subscription-server'
import { logFunnelEvent } from '@/lib/funnel'
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

      // Terminal step of the funnel. Recorded after the entitlement sync so
      // the event only fires once the subscription is actually reflected on
      // the profile.
      await logFunnelEvent('trial_started', {
        userId,
        properties: { stripeSubscriptionId: stripeSubscriptionId ?? null },
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
        .select('id, referred_by, referral_rewarded, partner_referral_code')
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

      // Tutor/business partner commission -- a separate program from the
      // referral credit above (see scripts/tutor-partner-referrals-migration.sql).
      // Unlike that one-time-only reward, this runs on every paid invoice up
      // to the partner's commission_months, since the reward is ongoing
      // cash commission rather than a single credit.
      if (referee?.partner_referral_code) {
        try {
          const { data: partner } = await supabase
            .from('referral_partners')
            .select('code, commission_pct, commission_months')
            .eq('code', referee.partner_referral_code)
            .single()

          if (partner) {
            // Sequence number = how many commission rows already exist for
            // this profile + 1. Not strictly atomic against a concurrent
            // duplicate webhook delivery for a *different* invoice on the
            // same customer -- acceptable here since stripe_invoice_id's
            // unique constraint still prevents any single invoice being
            // double-counted, and this report is reviewed by a human before
            // anyone is actually paid, not an auto-pay pipeline.
            const { count: priorCount } = await supabase
              .from('partner_commissions')
              .select('id', { count: 'exact', head: true })
              .eq('profile_id', referee.id)

            const invoiceSequence = (priorCount ?? 0) + 1

            if (invoiceSequence <= partner.commission_months) {
              const amountPaidCents = invoice.amount_paid ?? 0
              const commissionCents = Math.round((amountPaidCents * partner.commission_pct) / 100)
              const periodStart = new Date(invoice.created * 1000)
              periodStart.setUTCDate(1)

              const { error: commissionError } = await supabase.from('partner_commissions').insert({
                partner_code: partner.code,
                profile_id: referee.id,
                stripe_invoice_id: invoice.id,
                invoice_sequence: invoiceSequence,
                amount_paid_cents: amountPaidCents,
                commission_cents: commissionCents,
                currency: invoice.currency,
                period_start: periodStart.toISOString().split('T')[0],
              })

              // Code 23505 = unique_violation: a redelivered webhook for an
              // invoice already recorded, not a real failure.
              if (commissionError && commissionError.code !== '23505') {
                console.error('Error recording partner commission:', commissionError)
              } else if (!commissionError) {
                console.log(
                  `Partner commission recorded: ${partner.code} earns ${commissionCents / 100} ${invoice.currency} for ${referee.id}'s invoice ${invoiceSequence}/${partner.commission_months}`
                )
              }
            }
          }
        } catch (commissionErr) {
          console.error('Error processing partner commission:', commissionErr)
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
