import { stripe } from '@/lib/stripe'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

// Use the service role client for webhook operations.
// The normal server client relies on cookies (which webhooks don't have).
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
  } catch (error: any) {
    console.error(`Webhook Error: ${error.message}`)
    return NextResponse.json({ error: `Webhook Error: ${error.message}` }, { status: 400 })
  }

  const supabase = createServiceClient()

  // Handle successful checkout — upgrade user to Pro
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const userId = session.metadata?.userId
    const stripeCustomerId = session.customer as string

    if (userId) {
      // 1. Check for any pending referral credits
      const { data: profile } = await supabase
        .from('profiles')
        .select('pending_referral_credits')
        .eq('id', userId)
        .single()

      if (profile?.pending_referral_credits && profile.pending_referral_credits > 0) {
        try {
          // Calculate total banked credit (£19.99 * credits)
          const totalCredit = profile.pending_referral_credits * 1999
          
          await stripe.customers.createBalanceTransaction(stripeCustomerId, {
            amount: -totalCredit,
            currency: 'gbp',
            description: `Banked Referral Credits: ${profile.pending_referral_credits} months applied`,
          })

          // Reset pending credits in DB
          await supabase
            .from('profiles')
            .update({ pending_referral_credits: 0 })
            .eq('id', userId)

          console.log(`Applied ${profile.pending_referral_credits} banked credits to user ${userId}`)
        } catch (creditErr) {
          console.error('Error applying banked credits:', creditErr)
        }
      }

      // 2. Standard upgrade to Pro
      const { error } = await supabase
        .from('profiles')
        .update({ 
          subscription_status: 'pro',
          stripe_customer_id: stripeCustomerId 
        })
        .eq('id', userId)

      if (error) {
        console.error('Error updating user subscription status:', error)
      }
    }
  }

  // Handle subscription cancellation — downgrade user to Free
  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription
    const stripeCustomerId = subscription.customer as string

    if (stripeCustomerId) {
      const { error } = await supabase
        .from('profiles')
        .update({ subscription_status: 'free' })
        .eq('stripe_customer_id', stripeCustomerId)

      if (error) {
        console.error('Error downgrading user subscription:', error)
      }
    }
  }

  // Handle successful payments — issue referral rewards
  if (event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object as Stripe.Invoice
    const stripeCustomerId = invoice.customer as string

    // Only process if it's a subscription payment (not a one-off)
    if ((invoice as any).subscription && stripeCustomerId) {
      // 1. Find the referee's profile
      const { data: referee } = await supabase
        .from('profiles')
        .select('id, referred_by, referral_rewarded')
        .eq('stripe_customer_id', stripeCustomerId)
        .single()

      // 2. If they were referred and haven't been rewarded yet
      if (referee?.referred_by && !referee.referral_rewarded) {
        // 3. Find the referrer
        const { data: referrer } = await supabase
          .from('profiles')
          .select('id, stripe_customer_id, referral_count, pending_referral_credits')
          .eq('id', referee.referred_by)
          .single()

        // 4. Apply reward if referrer is under the cap (5)
        if (referrer && (referrer.referral_count || 0) < 5) {
          try {
            // IF REFERRER HAS STRIPE ID: Apply credit immediately
            if (referrer.stripe_customer_id) {
              await stripe.customers.createBalanceTransaction(referrer.stripe_customer_id, {
                amount: -1999,
                currency: 'gbp',
                description: 'Referral Reward: 1 Free Month',
              })
              
              // Use atomic increment RPC to prevent race conditions
              await supabase.rpc('increment_referral_count', { user_id: referrer.id })
            } 
            // IF REFERRER IS FREE: Bank the credit for later
            else {
              await supabase.rpc('bank_referral_credit', { user_id: referrer.id })
            }

            // Mark referee as rewarded
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

  // Handle failed payments — optionally downgrade or notify
  if (event.type === 'invoice.payment_failed') {
    const invoice = event.data.object as Stripe.Invoice
    const stripeCustomerId = invoice.customer as string

    if (stripeCustomerId) {
      console.error(`Payment failed for customer: ${stripeCustomerId}`)
    }
  }

  return NextResponse.json({ received: true })
}
