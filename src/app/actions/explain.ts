'use server'

import { createClient } from '@/lib/supabase/server'

export async function saveExplanation(questionId: string, explanationText: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('explanations')
    .upsert({
      question_id: questionId,
      explanation_text: explanationText,
      helpful_count: 1,
      is_verified: false
    }, { onConflict: 'question_id' })

  if (error) throw new Error(error.message)
  
  return { success: true }
}
