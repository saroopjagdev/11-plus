import { stripe } from '@/lib/stripe'
import { hasProAccess } from '@/lib/entitlements'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const priceId = process.env.NEXT_PUBLIC_PRO_PRICE_ID
    if (!priceId) {
       return NextResponse.json({ error: 'Price ID not configured' }, { status: 500 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('referred_by, partner_referral_code, stripe_customer_id, subscription_status, lifetime_access')
      .eq('id', user.id)
      .single()

    if (hasProAccess(profile)) {
      return NextResponse.json(
        { error: 'An active subscription or trial already exists.' },
        { status: 400 }
      )
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      // A signup matches at most one of these (see resolveReferralCode in
      // app/actions/auth.ts), so checking referred_by first and falling
      // back to partner_referral_code is safe — never both discounts at
      // once. TUTORPARTNER15 is a flat 15%-off-once coupon shared by every
      // partner for now; referral_partners.discount_pct exists for future
      // per-partner customization but isn't wired to a dynamic coupon yet.
      discounts: profile?.referred_by
        ? [{ coupon: 'REFERRAL50' }]
        : profile?.partner_referral_code
          ? [{ coupon: 'TUTORPARTNER15' }]
          : [],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/pricing`,
      ...(profile?.stripe_customer_id
        ? { customer: profile.stripe_customer_id }
        : { customer_email: user.email }),
      client_reference_id: user.id,
      metadata: {
        userId: user.id,
      },
      subscription_data: {
        trial_period_days: 7,
        metadata: {
          userId: user.id,
        },
      },
    })

    if (!session.url) {
        return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
    }

    return NextResponse.redirect(session.url, 303)
  } catch (error: unknown) {
    console.error('Stripe Checkout Error:', error)
    const message = error instanceof Error ? error.message : 'Failed to create checkout session'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
