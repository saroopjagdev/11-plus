'use server'

import { createClient } from '@/lib/supabase/server'

export async function saveExplanation(questionId: string, explanationText?: string) {
  const supabase = await createClient()

  const { data: existingExplanation, error: existingError } = await supabase
    .from('explanations')
    .select('id, helpful_count')
    .eq('question_id', questionId)
    .limit(1)
    .maybeSingle()

  if (existingError) throw new Error(existingError.message)

  if (existingExplanation) {
    const { error } = await supabase
      .from('explanations')
      .update({
        helpful_count: (existingExplanation.helpful_count || 0) + 1,
      })
      .eq('id', existingExplanation.id)

    if (error) throw new Error(error.message)
    return { success: true }
  }

  if (!explanationText) {
    return { success: true }
  }

  const { error } = await supabase
    .from('explanations')
    .insert({
      question_id: questionId,
      explanation_text: explanationText,
      helpful_count: 1,
      is_verified: false,
    })

  if (error) throw new Error(error.message)

  return { success: true }
}
