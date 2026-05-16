import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (!profile?.stripe_customer_id) {
      return NextResponse.json({ error: 'No active subscription found. Please join Pro first.' }, { status: 400 })
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/settings`,
    })

    if (!session.url) {
      return NextResponse.json({ error: 'Failed to create portal session' }, { status: 500 })
    }

    return NextResponse.redirect(session.url, 303)
  } catch (error: any) {
    console.error('Stripe Portal Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
