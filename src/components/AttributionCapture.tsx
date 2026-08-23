'use client'

import { useEffect } from 'react'

// First-touch marketing attribution. Mounted once in the root layout so it
// runs on every route a visitor might land on first — the diagnostic page,
// a /guides post, the homepage — not just one entry point.
//
// Deliberately first-touch, not last-touch: it never overwrites an existing
// cookie. A visitor who arrives from an Instagram bio link, browses around,
// and converts three days later should still be attributed to Instagram, not
// to whatever internal link they last clicked.
//
// Cookie (not localStorage) because it needs to be readable server-side, by
// the request-scoped `cookies()` in server actions — see src/lib/attribution.ts.
const COOKIE_NAME = 'ace_attribution'
const COOKIE_MAX_AGE_DAYS = 30
const UTM_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const

function hasExistingAttribution(): boolean {
  return document.cookie.split('; ').some((c) => c.startsWith(`${COOKIE_NAME}=`))
}

export function AttributionCapture() {
  useEffect(() => {
    try {
      if (hasExistingAttribution()) return

      const params = new URLSearchParams(window.location.search)
      const attribution: Record<string, string> = {}

      for (const key of UTM_PARAMS) {
        const value = params.get(key)
        if (value) attribution[key] = value
      }

      // Fall back to document.referrer for traffic that isn't UTM-tagged (a
      // raw link posted in a forum thread, for instance) — still tells us the
      // referring domain even with no campaign params attached.
      if (document.referrer && !attribution.utm_source) {
        try {
          attribution.referrer = new URL(document.referrer).hostname
        } catch {
          // malformed referrer — ignore rather than throw
        }
      }

      // Nothing to attribute (direct visit, no referrer, no UTM params) — skip
      // rather than write an empty cookie.
      if (Object.keys(attribution).length === 0) return

      const value = encodeURIComponent(JSON.stringify(attribution))
      const maxAge = COOKIE_MAX_AGE_DAYS * 24 * 60 * 60
      document.cookie = `${COOKIE_NAME}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`
    } catch {
      // Attribution is a nice-to-have. It must never be able to break the
      // page it's mounted on.
    }
  }, [])

  return null
}
