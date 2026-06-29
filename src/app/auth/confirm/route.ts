import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { EmailOtpType } from '@supabase/supabase-js'

const VALID_TYPES: EmailOtpType[] = ['signup', 'invite', 'magiclink', 'recovery', 'email_change', 'email']

/**
 * Email confirmation handler.
 *
 * Supabase email templates point here with a `token_hash` (and `type`).
 * token_hash verification is fully server-side and does NOT depend on a
 * PKCE code-verifier, so the link works from any browser, device, or email
 * client — which is what makes it reliable.
 *
 * We also accept a legacy `?code=` (PKCE) param as a fallback so any
 * confirmation emails already sitting in inboxes still work when opened in
 * the same browser they were created in.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const typeParam = searchParams.get('type')
  const code = searchParams.get('code')
  const email = searchParams.get('email')
  const next = searchParams.get('next') ?? '/dashboard'

  const supabase = await createClient()

  if (token_hash && typeParam) {
    const type = (VALID_TYPES.includes(typeParam as EmailOtpType)
      ? typeParam
      : 'email') as EmailOtpType
    const { error } = await supabase.auth.verifyOtp({ token_hash, type })
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Verification failed — send the user back to signup with a clear message
  // and their email pre-filled so they can request a fresh link in one tap.
  const fallback = new URL('/signup', origin)
  fallback.searchParams.set('confirm', '1')
  fallback.searchParams.set(
    'error',
    'This confirmation link is invalid or has expired. Please request a new one below.'
  )
  if (email) fallback.searchParams.set('email', email)
  return NextResponse.redirect(fallback)
}
