import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'

// Unsubscribe links are clicked from an email client, so the visitor is almost
// never carrying a session. This route previously used the request-scoped
// (RLS-bound) client, whose `profiles` UPDATE policy is `auth.uid() = id` —
// meaning a logged-out click matched zero rows, returned no error, and still
// rendered "Preferences Updated". Every real unsubscribe silently did nothing.
// The service-role client is required here for the same reason it is used
// elsewhere for unauthenticated writes.
const CONSENT_COLUMNS = {
  weekly: 'email_consent_weekly',
  nudges: 'email_consent_nudges',
} as const

type ConsentType = keyof typeof CONSENT_COLUMNS

function isConsentType(value: string | null): value is ConsentType {
  return value === 'weekly' || value === 'nudges'
}

function page(title: string, body: string, status = 200) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>${title} - Ace 11+</title>
      <style>
        body { font-family: -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f8fafc; color: #1e293b; margin: 0; }
        .card { background: white; padding: 40px; border-radius: 24px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); max-width: 400px; text-align: center; }
        h1 { font-size: 24px; font-weight: 800; margin-bottom: 16px; }
        p { color: #64748b; line-height: 1.6; margin-bottom: 24px; }
        .btn { background: #4f46e5; color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: 600; display: inline-block; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>${title}</h1>
        <p>${body}</p>
        <a href="/" class="btn">Back to Ace 11+</a>
      </div>
    </body>
    </html>
  `

  return new NextResponse(html, {
    status,
    headers: { 'Content-Type': 'text/html' },
  })
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token') // profile id
  const type = searchParams.get('type')

  // Previously `type === 'weekly' ? weekly : nudges`, so any typo or garbage
  // value silently unsubscribed the user from nudges instead — the wrong list.
  if (!token || !isConsentType(type)) {
    return page('Invalid link', 'This unsubscribe link is missing information or is malformed. Please use the link from the bottom of a recent email.', 400)
  }

  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('profiles')
    .update({ [CONSENT_COLUMNS[type]]: false })
    .eq('id', token)
    .select('id')

  if (error) {
    console.error('Unsubscribe update failed:', error)
    return page('Something went wrong', 'We could not update your preferences just now. Please try again, or reply to any of our emails and we will sort it out.', 500)
  }

  // Check rows actually changed. Without this a bad/stale token reports
  // success while leaving the user subscribed — the exact failure this route
  // shipped with.
  if (!data || data.length === 0) {
    return page('Link not recognised', 'We could not find an account for this unsubscribe link. It may be out of date. Please reply to any of our emails and we will remove you manually.', 404)
  }

  return page(
    'Preferences Updated',
    `You have been unsubscribed from our ${type === 'weekly' ? 'weekly progress reports' : 'reminder emails'}. You can re-enable these anytime in your account settings.`
  )
}
