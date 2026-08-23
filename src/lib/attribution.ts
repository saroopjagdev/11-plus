import { cookies } from 'next/headers'

// Server-side counterpart to src/components/AttributionCapture.tsx. Reads the
// first-touch cookie it set and shapes it into the columns added by
// scripts/utm-attribution-migration.sql. Called from wherever a visitor first
// becomes identifiable — captureLead (diagnostic guests) and both signup
// actions (everyone else, including the homepage-planner path that never
// touches the leads table at all).
const COOKIE_NAME = 'ace_attribution'

export interface Attribution {
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  utm_content: string | null
  utm_term: string | null
  landing_referrer: string | null
}

const EMPTY_ATTRIBUTION: Attribution = {
  utm_source: null,
  utm_medium: null,
  utm_campaign: null,
  utm_content: null,
  utm_term: null,
  landing_referrer: null,
}

export async function getAttribution(): Promise<Attribution> {
  try {
    const store = await cookies()
    const raw = store.get(COOKIE_NAME)?.value
    if (!raw) return EMPTY_ATTRIBUTION

    const parsed = JSON.parse(decodeURIComponent(raw)) as Record<string, unknown>

    return {
      utm_source: typeof parsed.utm_source === 'string' ? parsed.utm_source : null,
      utm_medium: typeof parsed.utm_medium === 'string' ? parsed.utm_medium : null,
      utm_campaign: typeof parsed.utm_campaign === 'string' ? parsed.utm_campaign : null,
      utm_content: typeof parsed.utm_content === 'string' ? parsed.utm_content : null,
      utm_term: typeof parsed.utm_term === 'string' ? parsed.utm_term : null,
      landing_referrer: typeof parsed.referrer === 'string' ? parsed.referrer : null,
    }
  } catch {
    // Malformed/tampered cookie — attribution is best-effort, never block the
    // signup or lead capture it's attached to.
    return EMPTY_ATTRIBUTION
  }
}
