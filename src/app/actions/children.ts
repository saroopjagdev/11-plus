'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface ChildGoals {
  childId: string
  examDate?: string | null
}

export async function updateChildGoals({ childId, examDate }: ChildGoals) {
  const supabase = await createClient()

  // Exam date is optional. Writing an empty string to a `date` column errors,
  // which would fail the whole update and leave has_completed_onboarding false —
  // that's what made onboarding reappear on every login. Only set the date when
  // we actually have one; always mark onboarding complete.
  const update: { has_completed_onboarding: true; exam_date?: string } = {
    has_completed_onboarding: true,
  }
  if (examDate) update.exam_date = examDate

  const { error } = await supabase
    .from('children')
    .update(update)
    .eq('id', childId)

  if (error) {
    console.error('Error updating child goals:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard')
  revalidatePath('/parent/dashboard')
  
  return { success: true }
}
