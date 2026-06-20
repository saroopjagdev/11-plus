'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

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
    return redirect('/login?error=' + encodeURIComponent(error.message))
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

    let referredBy = null
    if (referralCode) {
      const { data: referrer } = await supabase
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
    await supabase.from('profiles').upsert({
      id: user.id,
      email: email,
      referral_code: newReferralCode,
      referred_by: referredBy,
      subscription_status: 'free'
    })

    await attachLeadToUser(leadId, email, user.id)
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

  const childName = formData.get('childName') as string || 'Student'
  const childAge = parseInt(formData.get('childAge') as string) || 10
  const targetExamsRaw = formData.get('targetExams') as string || 'GL Assessment'
  const targetExams = targetExamsRaw.split(',').map(e => e.trim()).filter(Boolean)
  const examDate = formData.get('examDate') as string || new Date(Date.now() + 365 * 1.5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

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

    let referredBy = null
    if (referralCode) {
      const { data: referrer } = await supabase
        .from('profiles')
        .select('id')
        .eq('referral_code', referralCode)
        .single()
      
      if (referrer) {
        referredBy = referrer.id
      }
    }

    // Update the profile with the referral info
    await supabase.from('profiles').upsert({
      id: user.id,
      email: email,
      referral_code: newReferralCode,
      referred_by: referredBy,
      subscription_status: 'free'
    })

    await attachLeadToUser(leadId, email, user.id)

    // Auto-create child profile with details from onboarding planner
    await supabase.from('children').insert({
      parent_id: user.id,
      name: childName,
      age: childAge,
      target_exams: targetExams,
      exam_date: examDate,
      level: 1,
      xp: 0,
      total_points: 0,
      current_streak: 0,
      has_completed_onboarding: true
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
