import 'server-only'

import { stripe } from '@/lib/stripe'
import { AppSubscriptionStatus, normalizeAppSubscriptionStatus } from '@/lib/entitlements'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

type SyncSource = 'webhook' | 'checkout_return' | 'manual_repair'

interface SyncArgs {
  source: SyncSource
  eventType?: string
  userId?: string | null
  stripeCustomerId?: string | null
  stripeSubscriptionId?: string | null
  checkoutSessionId?: string | null
}

interface ProfileRecord {
  id: string
  subscription_status: string | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
}

function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function mapStripeStatus(status: Stripe.Subscription.Status): AppSubscriptionStatus {
  switch (status) {
    case 'trialing':
      return 'trialing'
    case 'active':
      return 'active'
    case 'past_due':
    case 'unpaid':
    case 'incomplete':
    case 'incomplete_expired':
      return 'past_due'
    case 'canceled':
      return 'canceled'
    default:
      return 'free'
  }
}

function toIsoString(timestamp: number | null | undefined) {
  return timestamp ? new Date(timestamp * 1000).toISOString() : null
}

function getCurrentPeriodEnd(subscription: Stripe.Subscription | null) {
  if (!subscription) return null

  const subscriptionWithPeriodEnd = subscription as Stripe.Subscription & {
    current_period_end?: number | null
  }

  return toIsoString(subscriptionWithPeriodEnd.current_period_end)
}

function getCustomerId(input: string | Stripe.Customer | Stripe.DeletedCustomer | null | undefined) {
  if (!input) return null
  return typeof input === 'string' ? input : input.id
}

function rankSubscription(subscription: Stripe.Subscription) {
  switch (subscription.status) {
    case 'active':
      return 5
    case 'trialing':
      return 4
    case 'past_due':
      return 3
    case 'unpaid':
      return 2
    case 'incomplete':
    case 'incomplete_expired':
      return 1
    case 'canceled':
      return 0
    default:
      return -1
  }
}

function pickBestSubscription(
  subscriptions: Stripe.Subscription[],
  preferredSubscriptionId?: string | null
) {
  if (subscriptions.length === 0) return null

  const sorted = [...subscriptions].sort((left, right) => {
    const rankDiff = rankSubscription(right) - rankSubscription(left)
    if (rankDiff !== 0) return rankDiff

    if (preferredSubscriptionId) {
      if (left.id === preferredSubscriptionId) return -1
      if (right.id === preferredSubscriptionId) return 1
    }

    return right.created - left.created
  })

  return sorted[0] ?? null
}

async function findProfile(
  userId?: string | null,
  stripeCustomerId?: string | null
) {
  const supabase = createAdminClient()

  if (userId) {
    const { data } = await supabase
      .from('profiles')
      .select('id, subscription_status, stripe_customer_id, stripe_subscription_id')
      .eq('id', userId)
      .maybeSingle()

    if (data) return data as ProfileRecord
  }

  if (stripeCustomerId) {
    const { data } = await supabase
      .from('profiles')
      .select('id, subscription_status, stripe_customer_id, stripe_subscription_id')
      .eq('stripe_customer_id', stripeCustomerId)
      .maybeSingle()

    if (data) return data as ProfileRecord
  }

  return null
}

async function listSubscriptionsForCustomer(customerId: string) {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: 'all',
    limit: 20,
  })

  return subscriptions.data
}

function logSyncEvent(payload: Record<string, unknown>) {
  console.log('[subscription-sync]', JSON.stringify(payload))
}

export async function syncSubscriptionEntitlement(args: SyncArgs) {
  const supabase = createAdminClient()

  let userId = args.userId ?? null
  let stripeCustomerId = args.stripeCustomerId ?? null
  let stripeSubscriptionId = args.stripeSubscriptionId ?? null

  if (args.checkoutSessionId) {
    const checkoutSession = await stripe.checkout.sessions.retrieve(args.checkoutSessionId, {
      expand: ['subscription'],
    })

    userId =
      userId ??
      checkoutSession.metadata?.userId ??
      checkoutSession.client_reference_id ??
      null
    stripeCustomerId = stripeCustomerId ?? getCustomerId(checkoutSession.customer)
    stripeSubscriptionId =
      stripeSubscriptionId ??
      (typeof checkoutSession.subscription === 'string'
        ? checkoutSession.subscription
        : checkoutSession.subscription?.id ?? null)
  }

  if (!userId && !stripeCustomerId) {
    logSyncEvent({
      source: args.source,
      eventType: args.eventType ?? null,
      error: 'missing_identifiers',
      stripeSubscriptionId,
    })
    return { success: false as const, reason: 'missing_identifiers' }
  }

  const profile = await findProfile(userId, stripeCustomerId)

  if (!profile) {
    logSyncEvent({
      source: args.source,
      eventType: args.eventType ?? null,
      error: 'profile_not_found',
      userId,
      stripeCustomerId,
      stripeSubscriptionId,
    })
    return { success: false as const, reason: 'profile_not_found' }
  }

  userId = profile.id
  stripeCustomerId = stripeCustomerId ?? profile.stripe_customer_id
  stripeSubscriptionId = stripeSubscriptionId ?? profile.stripe_subscription_id

  let currentSubscription: Stripe.Subscription | null = null
  let replacementSubscriptions: Stripe.Subscription[] = []

  if (stripeSubscriptionId) {
    try {
      currentSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId)
      stripeCustomerId =
        stripeCustomerId ?? getCustomerId(currentSubscription.customer)
    } catch (error) {
      logSyncEvent({
        source: args.source,
        eventType: args.eventType ?? null,
        error: 'stripe_subscription_fetch_failed',
        userId,
        stripeCustomerId,
        stripeSubscriptionId,
      })
      throw error
    }
  }

  if (stripeCustomerId) {
    try {
      replacementSubscriptions = await listSubscriptionsForCustomer(stripeCustomerId)
    } catch (error) {
      logSyncEvent({
        source: args.source,
        eventType: args.eventType ?? null,
        error: 'stripe_customer_subscription_list_failed',
        userId,
        stripeCustomerId,
        stripeSubscriptionId,
      })
      throw error
    }
  }

  const chosenSubscription =
    pickBestSubscription(replacementSubscriptions, stripeSubscriptionId) ?? currentSubscription

  const previousStatus = normalizeAppSubscriptionStatus(profile.subscription_status)
  const nextStatus = chosenSubscription
    ? mapStripeStatus(chosenSubscription.status)
    : stripeCustomerId || stripeSubscriptionId
      ? 'canceled'
      : 'free'

  const nextCustomerId =
    stripeCustomerId ??
    getCustomerId(chosenSubscription?.customer) ??
    profile.stripe_customer_id

  const nextSubscriptionId =
    chosenSubscription?.id ?? stripeSubscriptionId ?? profile.stripe_subscription_id

  const updatePayload = {
    stripe_customer_id: nextCustomerId ?? null,
    stripe_subscription_id: nextSubscriptionId ?? null,
    subscription_status: nextStatus,
    subscription_trial_end: toIsoString(chosenSubscription?.trial_end),
    subscription_current_period_end: getCurrentPeriodEnd(chosenSubscription),
    subscription_cancel_at_period_end: chosenSubscription?.cancel_at_period_end ?? false,
    subscription_last_synced_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('profiles')
    .update(updatePayload)
    .eq('id', profile.id)

  if (error) {
    logSyncEvent({
      source: args.source,
      eventType: args.eventType ?? null,
      error: 'supabase_profile_update_failed',
      userId: profile.id,
      stripeCustomerId: nextCustomerId,
      stripeSubscriptionId: nextSubscriptionId,
      previousStatus,
      nextStatus,
    })
    throw error
  }

  logSyncEvent({
    source: args.source,
    eventType: args.eventType ?? null,
    userId: profile.id,
    stripeCustomerId: nextCustomerId,
    stripeSubscriptionId: nextSubscriptionId,
    previousStatus,
    nextStatus,
  })

  return {
    success: true as const,
    profileId: profile.id,
    previousStatus,
    nextStatus,
    stripeCustomerId: nextCustomerId,
    stripeSubscriptionId: nextSubscriptionId,
  }
}

export async function reconcileCheckoutSessionForUser(
  checkoutSessionId: string,
  userId: string
) {
  const checkoutSession = await stripe.checkout.sessions.retrieve(checkoutSessionId, {
    expand: ['subscription'],
  })

  const sessionUserId =
    checkoutSession.metadata?.userId ?? checkoutSession.client_reference_id ?? null

  if (sessionUserId !== userId) {
    logSyncEvent({
      source: 'checkout_return',
      eventType: 'checkout.session.completed',
      error: 'checkout_user_mismatch',
      expectedUserId: userId,
      sessionUserId,
      stripeCustomerId: getCustomerId(checkoutSession.customer),
    })
    return { success: false as const, reason: 'checkout_user_mismatch' }
  }

  return syncSubscriptionEntitlement({
    source: 'checkout_return',
    eventType: 'checkout.session.completed',
    userId,
    checkoutSessionId,
  })
}
