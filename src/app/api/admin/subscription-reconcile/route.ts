import { syncSubscriptionEntitlement } from '@/lib/subscription-server'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

function getTokenCandidates(request: Request) {
  const url = new URL(request.url)
  const authHeader = request.headers.get('authorization')
  const bearerToken = authHeader?.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length)
    : null
  const headerToken = request.headers.get('x-repair-secret')
  const queryToken = url.searchParams.get('token')

  return {
    authHeader,
    bearerToken,
    headerToken,
    queryToken,
  }
}

function isAuthorized(request: Request) {
  const secret = process.env.SUBSCRIPTION_REPAIR_SECRET
  const tokens = getTokenCandidates(request)

  if (!secret) {
    console.error('SUBSCRIPTION_REPAIR_SECRET is not configured')
    return {
      authorized: false,
      reason: 'secret_not_configured',
      debug: {
        secretConfigured: false,
        authHeaderPresent: Boolean(tokens.authHeader),
        bearerTokenPresent: Boolean(tokens.bearerToken),
        headerTokenPresent: Boolean(tokens.headerToken),
        queryTokenPresent: Boolean(tokens.queryToken),
      },
    }
  }

  const providedToken =
    tokens.bearerToken ?? tokens.headerToken ?? tokens.queryToken ?? null

  if (providedToken !== secret) {
    return {
      authorized: false,
      reason: 'token_mismatch',
      debug: {
        secretConfigured: true,
        secretLength: secret.length,
        authHeaderPresent: Boolean(tokens.authHeader),
        bearerTokenPresent: Boolean(tokens.bearerToken),
        headerTokenPresent: Boolean(tokens.headerToken),
        queryTokenPresent: Boolean(tokens.queryToken),
        providedTokenLength: providedToken?.length ?? 0,
      },
    }
  }

  return {
    authorized: true,
    reason: 'authorized',
    debug: {
      secretConfigured: true,
    },
  }
}

export async function POST(request: Request) {
  const auth = isAuthorized(request)

  if (!auth.authorized) {
    return NextResponse.json(
      { error: 'Unauthorized', reason: auth.reason, debug: auth.debug },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const userId = typeof body.userId === 'string' ? body.userId : null
    const stripeCustomerId =
      typeof body.stripeCustomerId === 'string' ? body.stripeCustomerId : null
    const stripeSubscriptionId =
      typeof body.stripeSubscriptionId === 'string'
        ? body.stripeSubscriptionId
        : null

    if (!userId && !stripeCustomerId && !stripeSubscriptionId) {
      return NextResponse.json(
        { error: 'Provide userId, stripeCustomerId, or stripeSubscriptionId' },
        { status: 400 }
      )
    }

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

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON body', reason: 'invalid_json' },
        { status: 400 }
      )
    }

    const message =
      error instanceof Error ? error.message : 'Failed to reconcile subscription'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
