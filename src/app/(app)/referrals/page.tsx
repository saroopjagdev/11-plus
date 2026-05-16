import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Gift, Copy, Share2, Users, CheckCircle2, Sparkles, MessageSquare } from 'lucide-react'
import Link from 'next/link'

export default async function ReferralsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('referral_code, referral_count, pending_referral_credits, subscription_status')
    .eq('id', user.id)
    .single()

  const referralLink = `${process.env.NEXT_PUBLIC_SITE_URL}/signup?ref=${profile?.referral_code || ''}`
  const count = profile?.referral_count || 0
  const pending = profile?.pending_referral_credits || 0
  const isFree = profile?.subscription_status !== 'pro'
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
          Invite other parents to Ace 11+. When they join using your link, they'll get **50% off** their first month, and you'll get a full month for free.
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
          <section className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
            <h3 className="text-xl font-black text-slate-900 mb-6">Your Referral Link</h3>
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <div className="flex-1 p-4 bg-slate-50 border border-slate-100 rounded-2xl font-mono text-sm text-slate-600 break-all">
                {referralLink}
              </div>
              <button 
                className="px-6 py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200 shrink-0"
              >
                <Copy className="h-4 w-4" />
                Copy Link
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
               <ShareButton icon={<MessageSquare className="h-5 w-5" />} label="WhatsApp" color="emerald" />
               <ShareButton icon={<Share2 className="h-5 w-5" />} label="Email" color="indigo" />
               <ShareButton icon={<Users className="h-5 w-5" />} label="Messenger" color="sky" />
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

function ShareButton({ icon, label, color }: { icon: React.ReactNode, label: string, color: string }) {
  const colors: any = {
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100',
    sky: 'bg-sky-50 text-sky-600 border-sky-100 hover:bg-sky-100'
  }
  return (
    <button className={`p-4 rounded-2xl border ${colors[color]} flex flex-col items-center gap-2 transition-all font-bold text-sm`}>
      {icon}
      {label}
    </button>
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
