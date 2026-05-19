import { createClient } from '@/lib/supabase/server'
import {
  canManageBilling,
  getSubscriptionPlanLabel,
  hasProAccess,
  normalizeAppSubscriptionStatus,
} from '@/lib/entitlements'
import { redirect } from 'next/navigation'
import { Settings, User, CreditCard, Bell, Shield, LogOut } from 'lucide-react'
import Link from 'next/link'
import { signOut } from '@/app/actions/auth'

export default async function SettingsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const normalizedStatus = normalizeAppSubscriptionStatus(profile?.subscription_status)
  const planLabel = getSubscriptionPlanLabel(profile)
  const showBilling = canManageBilling(profile)
  const isPaidAccess = hasProAccess(profile)

  return (
    <div className="p-8 lg:p-12 max-w-4xl mx-auto">
      <header className="mb-12">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Account Settings</h1>
        <p className="text-slate-500">Manage your profile, subscription, and preferences.</p>
      </header>

      <div className="space-y-6">
        {/* Profile Section */}
        <section className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
           <div className="flex items-center gap-4 mb-8">
              <div className="h-16 w-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                 <User className="h-8 w-8" />
              </div>
              <div>
                 <h2 className="text-xl font-black text-slate-900">Personal Information</h2>
                 <p className="text-slate-400 text-sm font-medium">Your account details.</p>
              </div>
           </div>
           
           <div className="grid gap-6">
              <div className="space-y-2">
                 <label className="text-xs font-black uppercase text-slate-400 tracking-widest ml-1">Full Name</label>
                 <div className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700">
                   {profile?.full_name || <span className="text-slate-400">Not set</span>}
                 </div>
              </div>
              <div className="space-y-2">
                 <label className="text-xs font-black uppercase text-slate-400 tracking-widest ml-1 flex items-center gap-1">
                   Email Address
                   <span className="text-[9px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded-full ml-1 normal-case font-bold tracking-normal">cannot be changed</span>
                 </label>
                 <div className="w-full p-4 bg-slate-100 border border-slate-200 rounded-2xl font-bold text-slate-400 select-none">
                   {user!.email}
                 </div>
              </div>
           </div>
        </section>

         {/* Subscription Section */}
         <section className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
               <div className="flex items-center gap-4">
                  <div className="h-16 w-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
                     <CreditCard className="h-8 w-8" />
                  </div>
                  <div>
                     <h2 className="text-xl font-black text-slate-900">Subscription Plan</h2>
                     <div className="flex items-center gap-2">
                        <span className="text-indigo-600 font-bold uppercase text-sm">{planLabel}</span>
                        {normalizedStatus === 'trialing' && (
                          <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full uppercase tracking-wider">7-Day Trial</span>
                        )}
                     </div>
                  </div>
               </div>
               
               {showBilling ? (
                  <form action="/api/portal" method="POST">
                    <button type="submit" className="px-6 py-3 bg-white border-2 border-slate-100 text-slate-900 rounded-xl font-bold hover:bg-slate-50 transition-all flex items-center gap-2">
                       Manage Billing
                       <CreditCard className="h-4 w-4" />
                    </button>
                  </form>
               ) : (
                  <Link href="/pricing" className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all">
                     {isPaidAccess ? 'View Plan' : 'Upgrade to Pro'}
                  </Link>
               )}
            </div>
         </section>

        {/* Security Section */}
        <section className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
           <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-500" />
              Security
           </h3>
           <div className="space-y-4">
              <button className="w-full p-4 text-left bg-slate-50 rounded-2xl font-bold text-slate-600 hover:bg-slate-100 transition-all flex items-center justify-between">
                 Change Password
                 <span className="text-xs text-slate-400">Last changed 3 months ago</span>
              </button>
           </div>
        </section>

        {/* Logout */}
        <div className="pt-6">
           <form action={signOut}>
              <button type="submit" className="w-full p-5 bg-rose-50 text-rose-600 rounded-[2rem] font-black hover:bg-rose-100 transition-all flex items-center justify-center gap-2">
                 <LogOut className="h-5 w-5" />
                 Sign Out
              </button>
           </form>
        </div>
      </div>
    </div>
  )
}
