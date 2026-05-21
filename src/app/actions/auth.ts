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

  const confirmParams = new URLSearchParams({
    confirm: '1',
    email,
    message: 'Check your email to continue',
  })

  if (guestDiag) {
    confirmParams.set('guest_diag', guestDiag)
  }

  redirect(`/signup?${confirmParams.toString()}`)
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

  const confirmParams = new URLSearchParams({
    confirm: '1',
    email,
    message: 'Check your email to continue',
  })

  if (guestDiag) {
    confirmParams.set('guest_diag', guestDiag)
  }

  redirect(`/signup?${confirmParams.toString()}`)
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
    const errorParams = new URLSearchParams({
      error: 'Email is required to resend confirmation',
    })

    if (returnTo === 'signup') {
      errorParams.set('confirm', '1')
      if (guestDiag) errorParams.set('guest_diag', guestDiag)
      return redirect(`/signup?${errorParams.toString()}`)
    }

    return redirect(`/login?${errorParams.toString()}`)
  }

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: getEmailRedirectTo('/dashboard', email),
    }
  })

  if (error) {
    const errorParams = new URLSearchParams({
      error: error.message,
      email,
    })

    if (returnTo === 'signup') {
      errorParams.set('confirm', '1')
      if (guestDiag) errorParams.set('guest_diag', guestDiag)
      return redirect(`/signup?${errorParams.toString()}`)
    }

    return redirect(`/login?${errorParams.toString()}`)
  }

  const messageParams = new URLSearchParams({
    message: 'Confirmation email resent. Please check your inbox.',
    email,
  })

  if (returnTo === 'signup') {
    messageParams.set('confirm', '1')
    if (guestDiag) messageParams.set('guest_diag', guestDiag)
    redirect(`/signup?${messageParams.toString()}`)
  }

  redirect(`/login?${messageParams.toString()}`)
}
