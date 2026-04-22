'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function addChild(formData: FormData) {
  const supabase = await createClient()

  const name = formData.get('name') as string
  const age = parseInt(formData.get('age') as string)
  const targetExams = formData.getAll('targetExams') as string[]

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('children')
    .insert({
      parent_id: user.id,
      name,
      age,
      target_exams: targetExams,
      level: 1,
      xp: 0,
      total_points: 0,
      current_streak: 0
    })
    .select()
    .single()

  if (error) {
    console.error('Error adding child:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  redirect('/dashboard')
}

export async function updateChildAvatar(childId: string, avatarId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('children')
    .update({ avatar_url: avatarId })
    .eq('id', childId)

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard')
  revalidatePath('/leaderboard')
  
  return { success: true }
}
