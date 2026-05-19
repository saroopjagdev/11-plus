import { createClient } from '@/lib/supabase/server'
import {
  canManageBilling,
  getSubscriptionCallout,
  getSubscriptionPlanLabel,
  hasProAccess,
} from '@/lib/entitlements'
import { redirect } from 'next/navigation'
import { getWeeklyReport, getParentDashboardData, generateWeeklyReport } from '@/app/actions/parent'
import { TrendingUp, AlertTriangle, Clock, ChevronRight, LayoutDashboard, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { ParentCharts } from '@/components/ParentCharts'

export default async function ParentDashboardPage() {
  const supabase = await createClient()

  // 1. Auth & Role Check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, subscription_status, stripe_customer_id')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'parent') redirect('/dashboard')
  const profileHasAccess = hasProAccess(profile)
  const showBilling = canManageBilling(profile)
  const planLabel = getSubscriptionPlanLabel(profile)
  const planCallout = getSubscriptionCallout(profile)

  // 2. Fetch Child
  const { data: children } = await supabase
    .from('children')
    .select('*')
    .eq('parent_id', user.id)
    .limit(1)

  const child = children?.[0]
  if (!child) redirect('/dashboard/add-student')

  // 3. Get/Generate Weekly Report
  let report = await getWeeklyReport(child.id)

  if (!report) {
    // Attempt to generate if it's the first visit of the week
    const genResult = await generateWeeklyReport(child.id)
    if (genResult.success) {
      report = { ai_summary: genResult.aiSummary }
    }
  }

  // 4. Get Dashboard Stats
  const stats = await getParentDashboardData(child.id)

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black text-slate-900 mb-2">Parent Dashboard</h1>
            <p className="text-slate-500 font-medium">Monitoring {child.name}&apos;s 11+ progress</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-100">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Current XP</p>
              <p className="text-2xl font-black text-indigo-600">{child.xp}</p>
            </div>
            <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-100 text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Level</p>
              <p className="text-2xl font-black text-violet-600">{child.level}</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Analytics Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* High Level Stats */}
            <section className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <div className="h-12 w-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-indigo-600" />
                </div>
                <h2 className="text-2xl font-black text-slate-900">Subject Progress</h2>
              </div>

              <ParentCharts subjectData={stats.subjectStats} />
            </section>

            {/* Weekly AI Insight Card */}
            <section className="bg-slate-900 text-white p-10 rounded-[3rem] shadow-xl relative overflow-hidden group">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center">
                      <Sparkles className="h-6 w-6 text-indigo-400" />
                    </div>
                    <h2 className="text-2xl font-black italic tracking-tight">Weekly &ldquo;Exam Trap&rdquo; Report</h2>
                  </div>
                </div>

                {report ? (
                  <div className="prose prose-invert max-w-none">
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-8 leading-relaxed text-slate-300 text-sm whitespace-pre-wrap">
                      {report.ai_summary}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white/5 border border-white/10 rounded-3xl p-12 text-center">
                    <AlertTriangle className="h-12 w-12 text-amber-400 mx-auto mb-4 opacity-50" />
                    <p className="text-slate-400 font-bold italic">Not enough data to generate this week&apos;s analysis yet.</p>
                    <p className="text-slate-500 text-sm mt-2 font-medium">Reports update every Monday based on recent practice sessions.</p>
                  </div>
                )}
              </div>
              <div className="absolute -right-20 -bottom-20 h-80 w-80 bg-indigo-600/20 rounded-full blur-[100px]" />
            </section>
          </div>

          {/* Right Sidebar - Recent Activity */}
          <div className="space-y-8">
            <section className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
              <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                <Clock className="h-5 w-5 text-indigo-600" />
                Recent Activity
              </h3>

              <div className="space-y-4">
                {stats.recentSessions.length > 0 ? stats.recentSessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-indigo-100 transition-colors">
                    <div>
                      <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{session.type}</p>
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                        {new Date(session.completed_at || session.started_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-indigo-600">Score: {session.score}</p>
                    </div>
                  </div>
                )) : (
                  <p className="text-sm font-bold text-slate-400 italic py-4">No recent activity found.</p>
                )}
              </div>
            </section>

            <section className="bg-indigo-50 p-8 rounded-[3rem] border border-indigo-100 relative group overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-xl font-black text-indigo-900 mb-2">{planLabel}</h3>
                <p className="text-indigo-600/80 text-sm font-medium mb-6">{planCallout}</p>
                <Link
                  href={showBilling ? '/settings' : '/pricing'}
                  className="inline-flex items-center gap-2 text-indigo-700 font-black text-sm uppercase tracking-widest hover:gap-3 transition-all"
                >
                  {profileHasAccess ? 'Manage Plan' : 'Upgrade Now'} <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
              <LayoutDashboard className="absolute -right-4 -bottom-4 h-24 w-24 text-indigo-600/5 rotate-12" />
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
