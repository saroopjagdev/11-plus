'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function mockUpgrade() {
  const supabase = await createClient()

  // 1. Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Not authenticated')

  // 2. Update subscription status
  const { error } = await supabase
    .from('profiles')
    .update({ subscription_status: 'pro' })
    .eq('id', user.id)

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard')
  revalidatePath('/billing')
  redirect('/dashboard?message=Upgrade Successful!')
}

export async function mockDowngrade() {
  const supabase = await createClient()

  // 1. Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Not authenticated')

  // 2. Update subscription status
  const { error } = await supabase
    .from('profiles')
    .update({ subscription_status: 'free' })
    .eq('id', user.id)

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard')
  revalidatePath('/billing')
  redirect('/billing')
}
