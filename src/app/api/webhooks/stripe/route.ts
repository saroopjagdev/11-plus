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
      // Store the Stripe Customer ID so we can look up the user on cancellation
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
    if (invoice.subscription && stripeCustomerId) {
      // 1. Find the referee's profile
      const { data: referee, error: refError } = await supabase
        .from('profiles')
        .select('id, referred_by, referral_rewarded')
        .eq('stripe_customer_id', stripeCustomerId)
        .single()

      // 2. If they were referred and haven't been rewarded yet
      if (referee?.referred_by && !referee.referral_rewarded) {
        // 3. Find the referrer
        const { data: referrer, error: referrerError } = await supabase
          .from('profiles')
          .select('id, stripe_customer_id, referral_count')
          .eq('id', referee.referred_by)
          .single()

        // 4. Apply reward if referrer is under the cap (5)
        if (referrer && (referrer.referral_count || 0) < 5) {
          try {
            // Apply £19.99 credit to referrer's Stripe account
            if (referrer.stripe_customer_id) {
              await stripe.customers.createBalanceTransaction(referrer.stripe_customer_id, {
                amount: -1999, // £19.99 in pence (negative means credit)
                currency: 'gbp',
                description: 'Referral Reward: 1 Free Month',
              })
            }

            // 5. Update database: Increment referrer count and mark referee as rewarded
            await supabase
              .from('profiles')
              .update({ referral_count: (referrer.referral_count || 0) + 1 })
              .eq('id', referrer.id)

            await supabase
              .from('profiles')
              .update({ referral_rewarded: true })
              .eq('id', referee.id)

            console.log(`Referral reward issued: ${referrer.id} credited for ${referee.id}`)
          } catch (stripeErr) {
            console.error('Error creating Stripe balance transaction:', stripeErr)
          }
        }
      }
    }
  }

  // Handle failed payments — optionally downgrade or notify
  if (event.type === 'invoice.payment_failed') {

  return NextResponse.json({ received: true })
}
