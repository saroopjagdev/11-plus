import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  // 1. Get current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
  }

  // 2. Reset status to free
  const { error } = await supabase
    .from('profiles')
    .update({ subscription_status: 'free' })
    .eq('id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.redirect(new URL('/dashboard?reset=true', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'))
}
