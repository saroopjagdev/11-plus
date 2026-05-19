import { createClient } from '@/lib/supabase/server'
import { hasProAccess } from '@/lib/entitlements'
import { redirect } from 'next/navigation'
import { Gift, Copy, Share2, Users, CheckCircle2, Sparkles, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { CopyButton } from '@/components/CopyButton'

export default async function ReferralsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let profile = await supabase
    .from('profiles')
    .select('referral_code, referral_count, pending_referral_credits, subscription_status, email')
    .eq('id', user.id)
    .single()
    .then(res => res.data)

  // AUTO-HEAL: If user doesn't have a referral code yet, generate and save one using the service client
  if (profile && !profile.referral_code) {
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase()
    const base = profile.email?.split('@')[0].substring(0, 5).toUpperCase() || 'ACE'
    const newCode = `${base}${randomSuffix}`
    
    // Import createClient directly from supabase-js for the service role
    const { createClient: createServiceClient } = require('@supabase/supabase-js')
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    await serviceClient
      .from('profiles')
      .update({ referral_code: newCode })
      .eq('id', user.id)
    
    // Update local profile object
    profile.referral_code = newCode
  }

  const referralLink = `${process.env.NEXT_PUBLIC_SITE_URL || ''}/signup?ref=${profile?.referral_code || ''}`
  const count = profile?.referral_count || 0
  const pending = profile?.pending_referral_credits || 0
  const isFree = !hasProAccess(profile)
  const maxReferrals = 5

  return (
    <div className="p-8 lg:p-12 max-w-5xl mx-auto">
      <header className="mb-12">
        <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-full mb-4">
          <Gift className="h-4 w-4 text-indigo-600" />
          <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest">Rewards Program</span>
        </div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Give 50%, get a month.</h1>
        <p className="text-slate-500 text-lg max-w-xl">
          Invite other parents to Ace 11+. When they join using your link, they'll get <span className="font-bold text-slate-900">50% off</span> their first month, and you'll get a full month for free.
        </p>
      </header>

      {isFree && pending > 0 && (
        <div className="mb-8 p-6 bg-amber-50 border border-amber-100 rounded-[2.5rem] flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-black text-amber-900">You have £{(pending * 19.99).toFixed(2)} waiting for you!</h4>
              <p className="text-amber-700/60 text-sm font-medium">Join Pro today to automatically claim your referral credits.</p>
            </div>
          </div>
          <Link href="/pricing" className="px-6 py-3 bg-amber-600 text-white rounded-xl font-bold text-sm hover:bg-amber-700 transition-all shadow-lg shadow-amber-200 shrink-0">
            Claim Rewards
          </Link>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Referral Card */}
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <Share2 className="h-5 w-5 text-indigo-600" />
              <h3 className="text-xl font-black text-slate-900">Invite Parents</h3>
            </div>
            
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">
              Copy your unique link below and share it with friends, family, or in parent groups. 
              Anyone who signs up with this link will automatically have their discount applied.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 p-4 bg-slate-50 border border-slate-100 rounded-2xl font-mono text-sm text-indigo-600 flex items-center overflow-hidden">
                <span className="truncate">{referralLink}</span>
              </div>
              <CopyButton text={referralLink} />
            </div>
            
            <div className="mt-8 pt-8 border-t border-slate-50 flex items-center justify-between">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Also share via</div>
              <a 
                href={`mailto:?subject=50% off Ace 11+&body=I've been using Ace 11+ to help prepare for the exams. If you use my link you get 50% off your first month: ${referralLink}`}
                className="text-xs font-black text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5 transition-colors"
              >
                Email Invitation
              </a>
            </div>
          </section>

          <section className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-black mb-1">Your Progress</h3>
                  <p className="text-slate-400 text-sm font-medium">
                    {pending > 0 ? `You've earned ${count} months (${pending} pending).` : `You've earned ${count} out of ${maxReferrals} free months.`}
                  </p>
                </div>
                <div className="h-16 w-16 bg-white/10 rounded-2xl flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-amber-400" />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-400">Total Credits Earned</span>
                  <span className="text-2xl font-black">£{(count * 19.99).toFixed(2)}</span>
                </div>
                <div className="h-4 w-full bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-1000"
                    style={{ width: `${(count / maxReferrals) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <span>0 Months</span>
                  <span>{maxReferrals} Months Max</span>
                </div>
              </div>
            </div>
            <div className="absolute -right-20 -bottom-20 h-64 w-64 bg-indigo-500/20 rounded-full blur-[100px]" />
          </section>
        </div>

        {/* Info Sidebar */}
        <div className="space-y-6">
          <section className="bg-indigo-50 rounded-[2.5rem] p-8 border border-indigo-100">
            <h4 className="font-black text-indigo-900 mb-6">How it works</h4>
            <div className="space-y-6">
              <Step number="1" title="Share your link" desc="Send your unique link to fellow parents." />
              <Step number="2" title="They join Pro" desc="Your friend signs up and starts their Pro journey." />
              <Step number="3" title="Get Rewarded" desc="Once they make their first payment, you get £19.99 credited automatically." />
            </div>
          </section>

          <div className="p-8 bg-white border border-slate-100 rounded-[2.5rem]">
            <h4 className="font-black text-slate-900 mb-4">Terms</h4>
            <ul className="space-y-3">
              <li className="flex gap-3 text-xs text-slate-500 font-medium">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                Reward is for the referrer only.
              </li>
              <li className="flex gap-3 text-xs text-slate-500 font-medium">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                Valid for new Pro subscribers only.
              </li>
              <li className="flex gap-3 text-xs text-slate-500 font-medium">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                Limit of 5 free months per account.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

function Step({ number, title, desc }: { number: string, title: string, desc: string }) {
  return (
    <div className="flex gap-4">
      <div className="h-8 w-8 bg-white rounded-full flex items-center justify-center font-black text-indigo-600 shadow-sm shrink-0">
        {number}
      </div>
      <div>
        <h5 className="font-bold text-indigo-900 text-sm mb-1">{title}</h5>
        <p className="text-indigo-700/60 text-xs leading-relaxed font-medium">{desc}</p>
      </div>
    </div>
  )
}
