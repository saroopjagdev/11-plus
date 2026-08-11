import { createServiceClient } from '@/lib/supabase/service'

/**
 * First-party funnel analytics.
 *
 * The signup -> trial journey was previously unmeasurable: the only analytics
 * in the app is `@vercel/analytics` (pageviews), so working out where users
 * drop off meant querying Postgres by hand. Every stage worth measuring
 * happens in a server action or a server component, so events are recorded
 * server-side — no client tracking, no third-party processor, and therefore no
 * cookie-consent banner, which matters for a UK service used by parents of
 * children.
 *
 * Two deliberate properties:
 *
 *  - **It never throws.** Instrumentation must not be able to break a signup.
 *    Every failure is swallowed after logging; callers don't check a result.
 *  - **It doesn't deduplicate.** Some call sites sit in actions that can
 *    legitimately run more than once. Keeping the write dumb means there is no
 *    read-modify-write to get wrong; dedupe at query time instead:
 *
 *      select distinct on (user_id, event_name) *
 *      from funnel_events
 *      order by user_id, event_name, created_at;
 */
export type FunnelEventName =
  | 'diagnostic_completed'
  | 'lead_captured'
  | 'signup_submitted'
  | 'email_confirmed'
  | 'child_created'
  | 'onboarding_completed'
  | 'trial_started'

export async function logFunnelEvent(
  eventName: FunnelEventName,
  opts: {
    userId?: string | null
    leadId?: string | null
    properties?: Record<string, unknown>
  } = {}
): Promise<void> {
  try {
    const supabase = createServiceClient()
    const { error } = await supabase.from('funnel_events').insert({
      event_name: eventName,
      user_id: opts.userId ?? null,
      lead_id: opts.leadId ?? null,
      properties: opts.properties ?? {},
    })

    if (error) {
      console.error(`funnel_events insert failed for "${eventName}":`, error.message)
    }
  } catch (err) {
    console.error(`funnel_events insert threw for "${eventName}":`, err)
  }
}
