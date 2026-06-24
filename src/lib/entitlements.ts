export type AppSubscriptionStatus =
  | 'free'
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'

export interface SubscriptionProfileLike {
  subscription_status?: string | null
  stripe_customer_id?: string | null
  stripe_subscription_id?: string | null
  subscription_trial_end?: string | null
  subscription_current_period_end?: string | null
  subscription_cancel_at_period_end?: boolean | null
  lifetime_access?: boolean | null
}

export function normalizeAppSubscriptionStatus(
  status: string | null | undefined
): AppSubscriptionStatus {
  switch (status) {
    case 'trialing':
      return 'trialing'
    case 'active':
      return 'active'
    case 'past_due':
      return 'past_due'
    case 'canceled':
      return 'canceled'
    default:
      return 'free'
  }
}

export function hasProAccess(profile: SubscriptionProfileLike | null | undefined) {
  if (profile?.lifetime_access) return true
  const status = normalizeAppSubscriptionStatus(profile?.subscription_status)
  return status === 'trialing' || status === 'active'
}

export function canManageBilling(profile: SubscriptionProfileLike | null | undefined) {
  return Boolean(profile?.stripe_customer_id)
}

export function getSubscriptionPlanLabel(
  profile: SubscriptionProfileLike | null | undefined
) {
  const status = normalizeAppSubscriptionStatus(profile?.subscription_status)

  switch (status) {
    case 'trialing':
      return 'Trial Active'
    case 'active':
      return 'Pro Active'
    case 'past_due':
      return 'Payment Issue'
    case 'canceled':
      return 'Canceled'
    default:
      return 'Free'
  }
}

export function getSubscriptionCallout(
  profile: SubscriptionProfileLike | null | undefined
) {
  const status = normalizeAppSubscriptionStatus(profile?.subscription_status)

  switch (status) {
    case 'trialing':
      return 'Your free trial is active with full access to Mocks and AI analysis.'
    case 'active':
      return 'You currently have full access to Mocks and AI analysis.'
    case 'past_due':
      return 'There is a billing issue on this subscription. Full access may be limited until payment is resolved.'
    case 'canceled':
      return 'This subscription is canceled. Upgrade again to restore full access.'
    default:
      return 'You are on the Standard plan. Upgrade to unlock Mocks and unlimited AI help.'
  }
}
