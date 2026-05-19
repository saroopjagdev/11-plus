import { syncSubscriptionEntitlement } from '@/lib/subscription-server'
import { NextResponse } from 'next/server'

function isAuthorized(request: Request) {
  const authHeader = request.headers.get('authorization')
  const secret = process.env.SUBSCRIPTION_REPAIR_SECRET

  if (!secret) {
    console.error('SUBSCRIPTION_REPAIR_SECRET is not configured')
    return false
  }

  return authHeader === `Bearer ${secret}`
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const userId = typeof body.userId === 'string' ? body.userId : null
  const stripeCustomerId =
    typeof body.stripeCustomerId === 'string' ? body.stripeCustomerId : null
  const stripeSubscriptionId =
    typeof body.stripeSubscriptionId === 'string' ? body.stripeSubscriptionId : null

  if (!userId && !stripeCustomerId && !stripeSubscriptionId) {
    return NextResponse.json(
      { error: 'Provide userId, stripeCustomerId, or stripeSubscriptionId' },
      { status: 400 }
    )
  }

  try {
    const result = await syncSubscriptionEntitlement({
      source: 'manual_repair',
      eventType: 'manual_repair',
      userId,
      stripeCustomerId,
      stripeSubscriptionId,
    })

    return NextResponse.json(result)
  } catch (error: unknown) {
    console.error('Subscription reconciliation error:', error)
    const message =
      error instanceof Error ? error.message : 'Failed to reconcile subscription'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
