'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface ChildGoals {
  childId: string
  examDate: string
}

export async function updateChildGoals({ childId, examDate }: ChildGoals) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('children')
    .update({
      exam_date: examDate,
      has_completed_onboarding: true
    })
    .eq('id', childId)

  if (error) {
    console.error('Error updating child goals:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard')
  revalidatePath('/parent/dashboard')
  
  return { success: true }
}
