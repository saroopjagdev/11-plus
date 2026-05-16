import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Check, Sparkles, Zap, ShieldCheck, Star } from 'lucide-react'

export default async function PricingPage() {
  const supabase = await createClient()

  // 1. Auth Check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 2. Profile Check
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_status, referred_by')
    .eq('id', user.id)
    .single()

  const isPro = profile?.subscription_status === 'pro'
  const isReferred = !!profile?.referred_by

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto">
      <header className="text-center mb-8">
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
          {isReferred ? "Your friend got you a deal." : "Invest in their success."}
        </h1>
        <p className="text-slate-500 text-base max-w-xl mx-auto">
          {isReferred 
            ? "Join Ace 11+ Pro today and get 50% off your first month after your trial ends."
            : "Choose the plan that gives your child the edge in their 11+ preparation."
          }
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-6 items-start">
        {/* Standard Plan */}
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-slate-900 mb-1">Standard</h3>
            <p className="text-slate-500 text-xs">Perfect for baseline diagnostics.</p>
          </div>

          <div className="mb-6">
            <span className="text-4xl font-black text-slate-900">Free</span>
            <span className="text-slate-400 font-bold ml-2">/ month</span>
          </div>

          <div className="space-y-3 mb-6">
            <FeatureItem label="1 Full Diagnostic Baseline" />
            <FeatureItem label="5 Daily Practice Questions" />
            <FeatureItem label="Basic Topic Mastery Stats" />
            <FeatureItem label="Single Student Profile" />
            <FeatureItem label="Limited AI Explanations" disabled />
            <FeatureItem label="Full Mock Exams" disabled />
          </div>

          <button
            disabled
            className="w-full py-3 bg-slate-50 text-slate-400 rounded-xl font-bold transition-all cursor-not-allowed text-sm"
          >
            Current Plan
          </button>
        </div>

        {/* Pro Plan */}
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
            <span className="text-4xl font-black text-white">£19.99</span>
            <span className="text-slate-400 font-bold ml-2">/ month</span>
          </div>

          <div className="space-y-3 mb-6 relative z-10">
            <FeatureItem label="Unlimited Diagnostic Retakes" invert />
            <FeatureItem label="Unlimited Daily Drills" invert />
            <FeatureItem label="Access to all Full Mocks" invert />
            <FeatureItem label="Unlimited AI Tutor Explanations" invert />
            <FeatureItem label="Advanced Performance Analytics" invert />
            <FeatureItem label="Priority Topic Recommendations" invert />
          </div>

          {isPro ? (
            <button className="w-full py-3 bg-emerald-500 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 text-sm">
              Active Subscription
              <ShieldCheck className="h-4 w-4" />
            </button>
          ) : (
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
                Subscription begins automatically <br />
                unless cancelled.
              </p>
            </form>
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
  )
}

function FeatureItem({ label, disabled, invert }: { label: string, disabled?: boolean, invert?: boolean }) {
  return (
    <div className={`flex items-center gap-3 ${disabled ? 'opacity-30' : ''}`}>
      <div className={`h-5 w-5 ${invert ? 'bg-indigo-500' : 'bg-indigo-50'} rounded-full flex items-center justify-center`}>
        <Check className={`h-3 w-3 ${invert ? 'text-white' : 'text-indigo-600'}`} />
      </div>
      <span className={`text-sm font-bold ${invert ? 'text-white' : 'text-slate-600'}`}>{label}</span>
    </div>
  )
}
