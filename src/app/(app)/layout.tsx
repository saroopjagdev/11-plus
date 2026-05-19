import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/Sidebar'
import { redirect } from 'next/navigation'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // 1. Fetch user for the sidebar
  const { data: { user }, error } = await supabase.auth.getUser()
  
  // If no user on an "app" page, redirect to login
  if (error || !user) {
    redirect('/login')
  }

  // 2. Fetch profile for subscription status
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_status, stripe_customer_id, role')
    .eq('id', user.id)
    .single()

  // 3. Fetch primary child for sidebar stats
  const { data: childrenData } = await supabase
    .from('children')
    .select('name, xp, level, avatar_url')
    .eq('parent_id', user.id)
    .limit(1)

  const primaryChild = childrenData?.[0]

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar 
        userEmail={user.email} 
        subscriptionStatus={profile?.subscription_status || 'free'} 
        stripeCustomerId={profile?.stripe_customer_id}
        childName={primaryChild?.name}
        xp={primaryChild?.xp}
        level={primaryChild?.level}
        avatarUrl={primaryChild?.avatar_url}
        role={profile?.role}
      />
      <main className="flex-1 lg:pl-72 transition-all duration-300">
        {children}
      </main>
    </div>
  )
}
