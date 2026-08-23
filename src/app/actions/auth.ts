'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { EmailOtpType } from '@supabase/supabase-js'
import { logFunnelEvent } from '@/lib/funnel'
import { getAttribution } from '@/lib/attribution'
import { sendEmail } from '@/lib/resend'
import { wrapInTemplate } from '@/lib/email-automation'
import { EMAIL_FALLBACKS } from '@/lib/ai-emails'

const VALID_OTP_TYPES: EmailOtpType[] = ['signup', 'invite', 'magiclink', 'recovery', 'email_change', 'email']

// Defaults for the starter child row. The plain `/signup` path has no child
// details to work with (deliberately — it is the tail of the 20-question
// diagnostic funnel, where extra form fields are what we are trying to avoid),
// so it creates a placeholder and the dashboard onboarding modal collects the
// real name and school year on first load. `signUpAndCreateChild` reuses the
// same fallbacks for any field its wizard didn't supply.
const STARTER_CHILD_NAME = 'Student'
const STARTER_CHILD_AGE = 10
const STARTER_CHILD_EXAMS = ['GL Assessment']

function defaultExamDate() {
  return new Date(Date.now() + 365 * 1.5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
}

// Only allow relative, single-slash paths as post-confirmation redirect targets
// (guards against open-redirect via a crafted ?next= param).
function safeNext(next: string | null | undefined) {
  if (next && next.startsWith('/') && !next.startsWith('//')) return next
  return '/dashboard'
}

function getEmailRedirectTo(next = '/dashboard', email?: string) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const params = new URLSearchParams({
    next,
  })

  if (email) {
    params.set('email', email)
  }

  return `${baseUrl}/auth/confirm?${params.toString()}`
}

function getPasswordResetRedirectTo() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  return `${baseUrl}/reset-password`
}

function getFriendlyAuthError(message: string) {
  if (message.includes('over_email_send_rate_limit')) {
    return "You've requested confirmation emails too quickly. Please wait a few minutes before trying again."
  }

  return message
}

function buildSignupConfirmRedirect({
  email,
  guestDiag,
  message,
  error,
  existing,
  rateLimited,
}: {
  email?: string
  guestDiag?: string | null
  message?: string
  error?: string
  existing?: boolean
  rateLimited?: boolean
}) {
  const params = new URLSearchParams({
    confirm: '1',
  })

  if (email) {
    params.set('email', email)
  }

  if (message) {
    params.set('message', message)
  }

  if (error) {
    params.set('error', error)
  }

  if (guestDiag) {
    params.set('guest_diag', guestDiag)
  }

  if (existing) {
    params.set('existing', '1')
  }

  if (rateLimited) {
    params.set('rate_limited', '1')
  }

  return `/signup?${params.toString()}`
}

function buildForgotPasswordRedirect({
  message,
  error,
  email,
}: {
  message?: string
  error?: string
  email?: string
}) {
  const params = new URLSearchParams()

  if (message) {
    params.set('message', message)
  }

  if (error) {
    params.set('error', error)
  }

  if (email) {
    params.set('email', email)
  }

  return `/forgot-password${params.toString() ? `?${params.toString()}` : ''}`
}

function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Creates (or updates) the parent's starter child row during signup.
 *
 * Uses the service-role client, not the request-scoped one. Email
 * confirmation is enabled, so `auth.signUp` returns a user but NO session —
 * the request client is therefore still the anon role at this point, and
 * `children`'s INSERT policy is `auth.uid() = parent_id`. Verified against
 * production: that write fails with
 * `42501 new row violates row-level security policy for table "children"`.
 * Because the old code discarded the result, this failed silently, which is
 * why the homepage planner never actually produced a child despite collecting
 * four steps of detail from the user.
 *
 * `hasCompletedOnboarding` distinguishes the two callers: the planner has
 * already collected name/year/exams so it passes true; the plain signup path
 * creates a placeholder and passes false, which lets the dashboard's
 * ConversionOnboarding modal fire and collect the real details.
 *
 * `overwriteExisting` guards the placeholder case. Re-submitting the signup
 * form for an existing unconfirmed account is a supported flow, and blindly
 * updating the oldest child would rewrite a real child's name to 'Student'
 * and clobber their exam date. The planner passes true because the parent
 * just explicitly supplied those details; the plain signup path passes false
 * so an existing child is left completely untouched.
 */
async function upsertStarterChildProfile({
  userId,
  childName,
  childAge,
  targetExams,
  examDate,
  hasCompletedOnboarding,
  overwriteExisting,
}: {
  userId: string
  childName: string
  childAge: number
  targetExams: string[]
  examDate: string
  hasCompletedOnboarding: boolean
  overwriteExisting: boolean
}): Promise<{ childId: string | null; created: boolean }> {
  const admin = createAdminClient()

  const childPayload = {
    name: childName,
    age: childAge,
    target_exams: targetExams,
    exam_date: examDate,
    level: 1,
    xp: 0,
    total_points: 0,
    current_streak: 0,
    has_completed_onboarding: hasCompletedOnboarding,
  }

  const { data: existingChild, error: lookupError } = await admin
    .from('children')
    .select('id')
    .eq('parent_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (lookupError) {
    console.error('Starter child lookup failed:', lookupError)
    return { childId: null, created: false }
  }

  if (existingChild?.id) {
    if (!overwriteExisting) {
      return { childId: existingChild.id, created: false }
    }

    const { error } = await admin
      .from('children')
      .update(childPayload)
      .eq('id', existingChild.id)

    if (error) {
      console.error('Starter child update failed:', error)
      return { childId: null, created: false }
    }

    return { childId: existingChild.id, created: false }
  }

  const { data: inserted, error } = await admin
    .from('children')
    .insert({ parent_id: userId, ...childPayload })
    .select('id')
    .single()

  if (error) {
    console.error('Starter child insert failed:', error)
    return { childId: null, created: false }
  }

  await logFunnelEvent('child_created', {
    userId,
    properties: { source: 'signup', placeholder: !hasCompletedOnboarding },
  })

  return { childId: inserted?.id ?? null, created: true }
}

function getFriendlyLoginError(message: string) {
  if (message.includes('Email not confirmed')) {
    return 'Your account still needs email confirmation. Use the resend confirmation option below.'
  }

  if (message.includes('Invalid login credentials')) {
    return 'Your email or password did not match. If needed, reset your password.'
  }

  return getFriendlyAuthError(message)
}

async function attachLeadToUser(leadId: string | null, email: string, userId: string) {
  const admin = createAdminClient()
  const normalizedEmail = email.trim().toLowerCase()

  if (leadId) {
    const { error } = await admin
      .from('leads')
      .update({
        status: 'account_created',
        claimed_by_user_id: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', leadId)

    if (!error) return
    console.error('Lead attachment by id failed:', error)
  }

  const { error } = await admin
    .from('leads')
    .update({
      status: 'account_created',
      claimed_by_user_id: userId,
      updated_at: new Date().toISOString(),
    })
    .eq('email', normalizedEmail)
    .eq('source', 'diagnostic')
    .in('status', ['captured', 'signup_started'])
    .is('claimed_by_user_id', null)

  if (error) {
    console.error('Lead attachment by email failed:', error)
  }
}

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    return redirect('/login?error=' + encodeURIComponent(getFriendlyLoginError(error.message)))
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const referralCode = formData.get('referralCode') as string
  const leadId = formData.get('leadId') as string | null
  const guestDiag = formData.get('guestDiag') as string | null

  const { data: { user }, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: getEmailRedirectTo('/dashboard', email),
    },
  })

  if (error) {
    return redirect('/signup?error=' + encodeURIComponent(error.message))
  }

  const isRepeatedSignup = (user?.identities?.length ?? 0) === 0

  if (user) {
    // Generate a unique referral code for the new user (e.g. PART OF EMAIL + RANDOM)
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase()
    const base = email.split('@')[0].substring(0, 5).toUpperCase()
    const newReferralCode = `${base}${randomSuffix}`

    // Referrer lookup + the referred_by write below must run on the
    // service-role client, not the request-scoped one: email confirmation
    // means `signUp()` returns no session, so `auth.uid()` is null here and
    // `profiles`' RLS (`auth.uid() = id`) silently blocks both the lookup
    // (can't select another user's row) and the write (the trigger already
    // inserted this profile, so this is an UPDATE gated on auth.uid() = id,
    // which never matches while unauthenticated). Verified against
    // production: this is why `referred_by` was null on every one of the
    // first 72 signups regardless of referral code.
    const referralAdmin = createAdminClient()

    let referredBy = null
    if (referralCode) {
      const { data: referrer } = await referralAdmin
        .from('profiles')
        .select('id')
        .eq('referral_code', referralCode)
        .single()

      if (referrer) {
        referredBy = referrer.id
      }
    }

    // Update the profile with the referral info
    // We use upsert in case the trigger already created it
    const attribution = await getAttribution()
    await referralAdmin.from('profiles').upsert({
      id: user.id,
      email: email,
      referral_code: newReferralCode,
      referred_by: referredBy,
      subscription_status: 'free',
      ...attribution,
    })

    await attachLeadToUser(leadId, email, user.id)

    // Every signup gets a child. Without one the dashboard is inert (no
    // practice, no missions, no diagnostic claim) and — because
    // DashboardOnboardingTrigger needs a childId — the onboarding modal that
    // would guide the user cannot even render. That combination is what
    // stranded 39 of the first 70 signups. A placeholder is created here and
    // the modal collects the real name and school year on first dashboard
    // load; `overwriteExisting: false` keeps a re-submitted signup from
    // clobbering a child the parent already set up.
    await upsertStarterChildProfile({
      userId: user.id,
      childName: STARTER_CHILD_NAME,
      childAge: STARTER_CHILD_AGE,
      targetExams: STARTER_CHILD_EXAMS,
      examDate: defaultExamDate(),
      hasCompletedOnboarding: false,
      overwriteExisting: false,
    })

    await logFunnelEvent('signup_submitted', {
      userId: user.id,
      leadId: leadId || null,
      properties: { path: 'signup', repeated: isRepeatedSignup, fromDiagnostic: Boolean(guestDiag) },
    })
  }

  redirect(
    buildSignupConfirmRedirect({
      email,
      guestDiag,
      message: isRepeatedSignup
        ? 'This email is already registered and still waiting for confirmation. Use the resend option below if you need a fresh link.'
        : 'Check your email to continue.',
      existing: isRepeatedSignup,
    })
  )
}

export async function signUpAndCreateChild(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const referralCode = formData.get('referralCode') as string
  const leadId = formData.get('leadId') as string | null
  const guestDiag = formData.get('guestDiag') as string | null

  const childName = formData.get('childName') as string || STARTER_CHILD_NAME
  const childAge = parseInt(formData.get('childAge') as string) || STARTER_CHILD_AGE
  const targetExamsRaw = formData.get('targetExams') as string || STARTER_CHILD_EXAMS.join(',')
  const targetExams = targetExamsRaw.split(',').map(e => e.trim()).filter(Boolean)
  const examDate = formData.get('examDate') as string || defaultExamDate()

  const { data: { user }, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: getEmailRedirectTo('/dashboard', email),
    },
  })

  if (error) {
    return redirect('/signup?error=' + encodeURIComponent(error.message))
  }

  const isRepeatedSignup = (user?.identities?.length ?? 0) === 0

  if (user) {
    // Generate a unique referral code for the new user
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase()
    const base = email.split('@')[0].substring(0, 5).toUpperCase()
    const newReferralCode = `${base}${randomSuffix}`

    // See the comment in `signup` above: this must use the service-role
    // client because there is no session yet, and `profiles`' RLS would
    // otherwise silently block both the lookup and the write.
    const referralAdmin = createAdminClient()

    let referredBy = null
    if (referralCode) {
      const { data: referrer } = await referralAdmin
        .from('profiles')
        .select('id')
        .eq('referral_code', referralCode)
        .single()

      if (referrer) {
        referredBy = referrer.id
      }
    }

    // Update the profile with the referral info
    const attribution = await getAttribution()
    await referralAdmin.from('profiles').upsert({
      id: user.id,
      email: email,
      referral_code: newReferralCode,
      referred_by: referredBy,
      subscription_status: 'free',
      ...attribution,
    })

    await attachLeadToUser(leadId, email, user.id)

    // The wizard already collected name/year/exams, so onboarding has nothing
    // left to ask — skip the dashboard modal for this path.
    await upsertStarterChildProfile({
      userId: user.id,
      childName,
      childAge,
      targetExams,
      examDate,
      hasCompletedOnboarding: true,
      overwriteExisting: true,
    })

    await logFunnelEvent('signup_submitted', {
      userId: user.id,
      leadId: leadId || null,
      properties: { path: 'planner', repeated: isRepeatedSignup, fromDiagnostic: Boolean(guestDiag) },
    })
  }

  redirect(
    buildSignupConfirmRedirect({
      email,
      guestDiag,
      message: isRepeatedSignup
        ? 'This email is already registered and still waiting for confirmation. Use the resend option below if you need a fresh link.'
        : 'Check your email to continue.',
      existing: isRepeatedSignup,
    })
  )
}

/**
 * Verifies an email-confirmation token. This runs ONLY on an explicit form
 * POST (the user clicking "Confirm my email" on /auth/confirm) — never on a
 * GET/HEAD page load. That's deliberate: mail security scanners (Microsoft
 * Safe Links, etc.) prefetch links with GET/HEAD to check them, which would
 * consume Supabase's single-use token before the human ever clicks. Scanners
 * do not submit forms, so gating verification behind this POST keeps the token
 * alive until the real user acts.
 */
export async function confirmEmailToken(formData: FormData) {
  const supabase = await createClient()
  const tokenHash = formData.get('token_hash') as string | null
  const typeParam = formData.get('type') as string | null
  const code = formData.get('code') as string | null
  const email = (formData.get('email') as string | null) || undefined
  const next = safeNext(formData.get('next') as string | null)

  let verified = false

  if (tokenHash && typeParam) {
    const type = (VALID_OTP_TYPES.includes(typeParam as EmailOtpType)
      ? typeParam
      : 'email') as EmailOtpType
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
    verified = !error
  } else if (code) {
    // Legacy PKCE fallback for any older links still in inboxes.
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    verified = !error
  }

  if (verified) {
    // Confirmation is the only reliable post-signup hook: `signup` itself runs
    // before the account is usable (no session, unverified address), so this is
    // the first moment the user is genuinely real. Both calls are best-effort —
    // neither may block or fail the redirect the user is waiting on.
    const { data: { user } } = await supabase.auth.getUser()

    await logFunnelEvent('email_confirmed', { userId: user?.id })

    if (user?.email) {
      try {
        const unsubLink = `${process.env.NEXT_PUBLIC_SITE_URL}/api/unsubscribe?token=${user.id}&type=nudges`
        await sendEmail({
          to: user.email,
          subject: 'Welcome to Ace 11+',
          html: wrapInTemplate(EMAIL_FALLBACKS.welcome(), unsubLink),
        })
      } catch (err) {
        console.error('Welcome email failed:', err)
      }
    }

    revalidatePath('/', 'layout')
    redirect(next)
  }

  redirect(
    buildSignupConfirmRedirect({
      email,
      error: 'This confirmation link is invalid or has expired. Please request a new one below.',
    })
  )
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}

export async function resendEmail(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const returnTo = (formData.get('returnTo') as string) || 'login'
  const guestDiag = formData.get('guestDiag') as string | null
  
  if (!email) {
    if (returnTo === 'signup') {
      return redirect(
        buildSignupConfirmRedirect({
          guestDiag,
          error: 'Email is required to resend confirmation.',
        })
      )
    }

    return redirect('/login?error=' + encodeURIComponent('Email is required to resend confirmation.'))
  }

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: getEmailRedirectTo('/dashboard', email),
    }
  })

  if (error) {
    const friendlyError = getFriendlyAuthError(error.message)
    const rateLimited = error.message.includes('over_email_send_rate_limit')

    if (returnTo === 'signup') {
      return redirect(
        buildSignupConfirmRedirect({
          email,
          guestDiag,
          error: friendlyError,
          rateLimited,
        })
      )
    }

    return redirect(`/login?error=${encodeURIComponent(friendlyError)}`)
  }

  if (returnTo === 'signup') {
    redirect(
      buildSignupConfirmRedirect({
        email,
        guestDiag,
        message: 'Confirmation email resent. Please check your inbox.',
      })
    )
  }

  const messageParams = new URLSearchParams({
    message: 'Confirmation email resent. Please check your inbox.',
    email,
  })

  redirect(`/login?${messageParams.toString()}`)
}

export async function requestPasswordReset(formData: FormData) {
  const supabase = await createClient()
  const email = (formData.get('email') as string | null)?.trim() || ''

  if (!email) {
    return redirect(
      buildForgotPasswordRedirect({
        error: 'Email is required to send a password reset link.',
      })
    )
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: getPasswordResetRedirectTo(),
  })

  if (error) {
    const friendlyError = getFriendlyAuthError(error.message)
    return redirect(
      buildForgotPasswordRedirect({
        error: friendlyError,
        email,
      })
    )
  }

  return redirect(
    buildForgotPasswordRedirect({
      message: "If an account exists for that email, we've sent a password reset link.",
      email,
    })
  )
}
