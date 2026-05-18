'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

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

  const { data: { user }, error } = await supabase.auth.signUp({
    email,
    password,
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
  }

  redirect('/login?message=Check your email to continue')
}

export async function signUpAndCreateChild(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const referralCode = formData.get('referralCode') as string

  const childName = formData.get('childName') as string || 'Student'
  const childAge = parseInt(formData.get('childAge') as string) || 10
  const targetExamsRaw = formData.get('targetExams') as string || 'GL Assessment'
  const targetExams = targetExamsRaw.split(',').map(e => e.trim()).filter(Boolean)
  const examDate = formData.get('examDate') as string || new Date(Date.now() + 365 * 1.5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const { data: { user }, error } = await supabase.auth.signUp({
    email,
    password,
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

  redirect('/login?message=Check your email to continue')
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
  
  if (!email) {
    return redirect('/login?error=Email is required to resend confirmation')
  }

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    }
  })

  if (error) {
    return redirect('/login?error=' + encodeURIComponent(error.message))
  }

  redirect('/login?message=Confirmation email resent. Please check your inbox.')
}

