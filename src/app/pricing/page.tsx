import { createClient } from '@/lib/supabase/server'
import { getSubscriptionPlanLabel, hasProAccess, normalizeAppSubscriptionStatus } from '@/lib/entitlements'
import { Check, Sparkles, Zap, ShieldCheck, Star, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'Pricing | Ace 11+',
  description: 'Simple, transparent pricing for 11+ preparation. Start your 7-day free trial today.',
}

export default async function PublicPricingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let isPro = false
  let isReferred = false
  let planLabel = 'Pro Active'
  let status = 'free'

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status, referred_by')
      .eq('id', user.id)
      .single()

    status = normalizeAppSubscriptionStatus(profile?.subscription_status)
    isPro = hasProAccess(profile)
    isReferred = !!profile?.referred_by
    planLabel = getSubscriptionPlanLabel(profile)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Minimal nav */}
      <nav className="border-b border-slate-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-black text-slate-900 text-xl tracking-tight">Ace 11+</Link>
          <div className="flex items-center gap-4">
            {user ? (
              <Link href="/dashboard" className="flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">
                <ArrowLeft className="h-4 w-4" />
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">Log In</Link>
                <Link href="/signup" className="text-sm font-black bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-500 transition-colors">Join Free</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <div className="p-4 lg:p-8 max-w-5xl mx-auto">
        <header className="text-center mb-8 pt-8">
          {isReferred ? (
            <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-full mb-4 animate-bounce-slow">
              <Sparkles className="h-4 w-4 text-emerald-600" />
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">Referral Discount Applied: 50% OFF</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-full mb-4">
              <Sparkles className="h-4 w-4 text-indigo-600" />
              <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest">Elevate Learning</span>
            </div>
          )}
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-2">
            {isReferred ? 'Your friend got you a deal.' : 'Invest in their success.'}
          </h1>
          <p className="text-slate-500 text-base max-w-xl mx-auto">
            {isReferred
              ? 'Join Ace 11+ Pro today and get 50% off your first month after your trial ends.'
              : 'Choose the plan that gives your child the edge in their 11+ preparation.'
            }
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-6 items-start">
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-slate-900 mb-1">Standard</h3>
              <p className="text-slate-500 text-xs">Perfect for baseline diagnostics and day-to-day practice.</p>
            </div>

            <div className="mb-6">
              <span className="text-4xl font-black text-slate-900">Free</span>
              <span className="text-slate-400 font-bold ml-2">/ month</span>
            </div>

            <div className="space-y-3 mb-6">
              <FeatureItem label="1 Full Diagnostic Baseline" />
              <FeatureItem label="Unlimited topic practice" />
              <FeatureItem label="Basic Topic Mastery Stats" />
              <FeatureItem label="Single Student Profile" />
              <FeatureItem label="AI tutor explanations" disabled />
              <FeatureItem label="Written practice and full mocks" disabled />
            </div>

            {user ? (
              <button disabled className="w-full py-3 bg-slate-50 text-slate-400 rounded-xl font-bold transition-all cursor-not-allowed text-sm">
                {isPro ? 'Previous Plan' : 'Current Plan'}
              </button>
            ) : (
              <Link href="/signup" className="block w-full py-3 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm text-center hover:bg-slate-200 transition-colors">
                Get Started Free
              </Link>
            )}
          </div>

          <div className="bg-slate-900 p-6 rounded-[2.5rem] border-4 border-indigo-500 shadow-2xl shadow-indigo-200 relative overflow-hidden transform scale-105 z-10">
            <div className="absolute top-0 right-0 p-3">
              <div className="bg-indigo-500 text-white px-2 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest">Most Popular</div>
            </div>

            <div className="mb-6 relative z-10">
              <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                Ace11+ Pro
                <Star className="h-4 w-4 text-amber-400 fill-current" />
              </h3>
              <p className="text-slate-400 text-xs">Everything needed for competitive success.</p>
            </div>

            <div className="mb-6 relative z-10">
              <span className="text-4xl font-black text-white">&pound;19.99</span>
              <span className="text-slate-400 font-bold ml-2">/ month</span>
            </div>

            <div className="space-y-3 mb-6 relative z-10">
              <FeatureItem label="Unlimited diagnostic retakes" invert />
              <FeatureItem label="Unlimited topic practice" invert />
              <FeatureItem label="Access to all full mocks" invert />
              <FeatureItem label="Unlimited AI tutor explanations" invert />
              <FeatureItem label="Advanced performance analytics" invert />
              <FeatureItem label="Priority topic recommendations" invert />
            </div>

            {isPro ? (
              <button className="w-full py-3 bg-emerald-500 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 text-sm">
                {planLabel}
                <ShieldCheck className="h-4 w-4" />
              </button>
            ) : user ? (
              <form action="/api/checkout" method="POST">
                <button
                  type="submit"
                  className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-500 transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/30 active:scale-95"
                >
                  Start 7-Day Free Trial
                  <Zap className="h-4 w-4 fill-current" />
                </button>
                <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest mt-4 leading-relaxed">
                  No charge until day 7. <br />
                  Cancel any time before trial ends.
                </p>
              </form>
            ) : (
              <Link
                href="/signup"
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-500 transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/30 block text-center"
              >
                Start 7-Day Free Trial
                <Zap className="h-4 w-4 fill-current inline-block" />
              </Link>
            )}

            {!isPro && status === 'canceled' && (
              <p className="mt-4 text-center text-[10px] font-bold uppercase tracking-widest text-amber-300">
                Previous subscription canceled
              </p>
            )}

            <div className="absolute -right-20 -bottom-20 h-64 w-64 bg-indigo-500/20 rounded-full blur-[80px]" />
          </div>
        </div>

        <div className="mt-10 text-center">
          <p className="text-slate-600 text-[10px] font-bold uppercase tracking-[0.2em] mb-4">Trusted by parents for</p>
          <div className="flex flex-wrap justify-center gap-12 pointer-events-none">
            <span className="text-lg font-black text-slate-800">GL ASSESSMENT</span>
            <span className="text-lg font-black text-slate-800">CEM EXAM</span>
            <span className="text-lg font-black text-slate-800">ISEB CURRICULUM</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function FeatureItem({ label, disabled, invert }: { label: string; disabled?: boolean; invert?: boolean }) {
  return (
    <div className={`flex items-center gap-3 ${disabled ? 'opacity-30' : ''}`}>
      <div className={`h-5 w-5 ${invert ? 'bg-indigo-500' : 'bg-indigo-50'} rounded-full flex items-center justify-center`}>
        <Check className={`h-3 w-3 ${invert ? 'text-white' : 'text-indigo-600'}`} />
      </div>
      <span className={`text-sm font-bold ${invert ? 'text-white' : 'text-slate-600'}`}>{label}</span>
    </div>
  )
}
