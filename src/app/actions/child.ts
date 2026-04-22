'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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
