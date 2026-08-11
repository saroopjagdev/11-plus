'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { logFunnelEvent } from '@/lib/funnel'

interface ChildGoals {
  childId: string
  childName?: string | null
  childAge?: number | null
  examDate?: string | null
  focusAreas?: string[] | null
}

export async function updateChildGoals({
  childId,
  childName,
  childAge,
  examDate,
  focusAreas,
}: ChildGoals) {
  const supabase = await createClient()

  // Every field here is optional, and each one is only included when it holds a
  // real value. This matters beyond tidiness: writing an empty string to the
  // `date` column errors, which fails the *whole* update and leaves
  // has_completed_onboarding false — that's what previously made onboarding
  // reappear on every login. The same guard shape is applied to the other
  // fields so one blank input can never cost the user the rest of their setup.
  const update: {
    has_completed_onboarding: true
    name?: string
    age?: number
    exam_date?: string
    focus_areas?: string[]
  } = {
    has_completed_onboarding: true,
  }

  const trimmedName = childName?.trim()
  if (trimmedName) update.name = trimmedName
  if (typeof childAge === 'number' && Number.isFinite(childAge)) update.age = childAge
  if (examDate) update.exam_date = examDate
  if (focusAreas && focusAreas.length > 0) update.focus_areas = focusAreas

  const { error } = await supabase
    .from('children')
    .update(update)
    .eq('id', childId)

  if (error) {
    console.error('Error updating child goals:', error)
    return { success: false, error: error.message }
  }

  const { data: { user } } = await supabase.auth.getUser()
  await logFunnelEvent('onboarding_completed', {
    userId: user?.id,
    properties: {
      hasExamDate: Boolean(examDate),
      focusAreaCount: focusAreas?.length ?? 0,
    },
  })

  revalidatePath('/dashboard')
  revalidatePath('/parent/dashboard')

  return { success: true }
}
