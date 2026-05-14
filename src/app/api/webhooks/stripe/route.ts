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

  // Handle failed payments — optionally downgrade or notify
  if (event.type === 'invoice.payment_failed') {
    const invoice = event.data.object as Stripe.Invoice
    const stripeCustomerId = invoice.customer as string

    if (stripeCustomerId) {
      console.error(`Payment failed for customer: ${stripeCustomerId}`)
      // Stripe will retry automatically. After all retries fail, 
      // it sends customer.subscription.deleted which we handle above.
    }
  }

  return NextResponse.json({ received: true })
}
