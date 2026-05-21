import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Target, Trophy, ChevronRight, RotateCcw, BarChart2, Sparkles } from 'lucide-react'

function getDiagnosticStatus(score: number, totalQuestions = 20) {
  const ratio = totalQuestions > 0 ? score / totalQuestions : 0

  if (ratio === 1) return '11+ Ready'
  if (ratio >= 0.86) return 'Competent'
  if (ratio >= 0.61) return 'Developing'
  return 'Foundation'
}

function formatDiagnosticDate(dateString: string | null | undefined) {
  if (!dateString) return null

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateString))
}

export default async function DiagnosticsHubPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  const { data: children } = await supabase
    .from('children')
    .select('*')
    .eq('parent_id', user.id)
    .limit(1)

  const child = children?.[0] || null

  if (!child) {
    return (
      <div className="p-8 lg:p-12 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.85fr] gap-8">
          <section className="bg-white rounded-[2.5rem] border border-slate-100 p-10 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Target className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-1">No Child Added Yet</p>
                <h1 className="text-3xl font-black text-slate-900">Take the baseline first</h1>
              </div>
            </div>
            <p className="text-slate-500 max-w-2xl mb-8">
              You do not need to register a child before taking the diagnostic. Complete the baseline first, then add your child afterwards to save the result and attach it to their profile.
            </p>

            <div className="grid gap-4 mb-8">
              <div className="rounded-2xl bg-slate-50 border border-slate-100 p-5">
                <p className="font-bold text-slate-900 mb-1">Lower friction</p>
                <p className="text-sm text-slate-500">Get the baseline done first instead of filling in profile details up front.</p>
              </div>
              <div className="rounded-2xl bg-slate-50 border border-slate-100 p-5">
                <p className="font-bold text-slate-900 mb-1">Save it afterwards</p>
                <p className="text-sm text-slate-500">Once you add your child, the result can be attached to the student profile and used across the app.</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <Link
                href="/diagnostic"
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-8 py-4 font-bold text-white hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
              >
                Take Baseline Assessment
                <ChevronRight className="h-5 w-5" />
              </Link>
              <Link
                href="/dashboard/add-student"
                className="inline-flex items-center gap-2 rounded-2xl bg-indigo-50 px-8 py-4 font-bold text-indigo-700 hover:bg-indigo-100 transition-all border border-indigo-100"
              >
                Add Child First
                <ChevronRight className="h-5 w-5" />
              </Link>
            </div>
          </section>

          <section className="bg-indigo-50 rounded-[2.5rem] p-8 border border-indigo-100">
            <div className="h-12 w-12 rounded-2xl bg-white text-indigo-600 flex items-center justify-center mb-5 shadow-sm">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-3">How the save works</h3>
            <p className="text-sm text-slate-600 mb-5">
              If you take the diagnostic now, we can still hold the result in your session. After you add your child, you will be prompted to attach that baseline to their profile.
            </p>
            <div className="rounded-2xl bg-white/70 border border-white px-5 py-4 text-sm text-slate-600">
              This keeps the entry friction low while still making sure the baseline ends up on the right student record.
            </div>
          </section>
        </div>
      </div>
    )
  }

  const { data: diagnostic } = await supabase
    .from('diagnostic_results')
    .select('*')
    .eq('child_id', child.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const latestTopic = diagnostic?.topic_breakdown?.[0]?.topic || 'core topics'
  const latestDate = formatDiagnosticDate(diagnostic?.created_at)
  const status = diagnostic ? getDiagnosticStatus(diagnostic.score, 20) : null

  return (
    <div className="p-8 lg:p-12 max-w-6xl mx-auto space-y-8">
      <header>
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-4 py-2 mb-4">
          <Target className="h-4 w-4 text-indigo-600" />
          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-700">Baseline Assessment Hub</span>
        </div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Diagnostics</h1>
        <p className="text-slate-500 max-w-2xl">
          Use the baseline assessment to measure {child.name}&apos;s current 11+ readiness, spot weak areas early, and decide when it&apos;s time for a retake.
        </p>
      </header>

      {!diagnostic ? (
        <div className="grid grid-cols-1 lg:grid-cols-[1.25fr_0.85fr] gap-8">
          <section className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Trophy className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-1">No Baseline Yet</p>
                <h2 className="text-2xl font-black text-slate-900">Take the first diagnostic</h2>
              </div>
            </div>

            <p className="text-slate-500 mb-8 max-w-2xl">
              The diagnostic gives you a first honest read on strengths, weak topics, and where to focus practice next. It&apos;s the fastest way to turn guesswork into a real starting point.
            </p>

            <div className="grid gap-4 mb-8">
              <div className="rounded-2xl bg-slate-50 border border-slate-100 p-5">
                <p className="font-bold text-slate-900 mb-1">Clear baseline score</p>
                <p className="text-sm text-slate-500">See how your child is performing before you commit to a practice routine.</p>
              </div>
              <div className="rounded-2xl bg-slate-50 border border-slate-100 p-5">
                <p className="font-bold text-slate-900 mb-1">Topic-by-topic breakdown</p>
                <p className="text-sm text-slate-500">Quickly understand which question types need the most attention first.</p>
              </div>
              <div className="rounded-2xl bg-slate-50 border border-slate-100 p-5">
                <p className="font-bold text-slate-900 mb-1">Smarter next steps</p>
                <p className="text-sm text-slate-500">Use the result to guide practice hubs, recommendations, and future retakes.</p>
              </div>
            </div>

            <Link
              href="/diagnostic"
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-8 py-4 font-bold text-white hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
            >
              Take Baseline Assessment
              <ChevronRight className="h-5 w-5" />
            </Link>
          </section>

          <section className="bg-indigo-50 rounded-[2.5rem] p-8 border border-indigo-100">
            <div className="h-12 w-12 rounded-2xl bg-white text-indigo-600 flex items-center justify-center mb-5 shadow-sm">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-3">When to retake later</h3>
            <p className="text-sm text-slate-600 mb-5">
              After a focused block of practice, retake the diagnostic to see whether weak topics are moving into the competent range.
            </p>
            <div className="rounded-2xl bg-white/70 border border-white px-5 py-4 text-sm text-slate-600">
              Retakes are most useful after meaningful practice, not day to day. Think of this page as the place to check the last baseline and decide when to measure again.
            </div>
          </section>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1.25fr_0.85fr] gap-8">
          <section className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-2">Latest Diagnostic</p>
                <h2 className="text-3xl font-black text-slate-900">Most Recent Baseline</h2>
              </div>
              <div className="rounded-2xl bg-amber-50 border border-amber-100 px-4 py-3 text-right">
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-1">Taken</p>
                <p className="text-sm font-bold text-slate-800">{latestDate || 'Recently completed'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
              <div className="rounded-3xl bg-indigo-50 p-6 text-center">
                <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2">Status</p>
                <p className="text-3xl font-black text-indigo-600">{status}</p>
              </div>
              <div className="rounded-3xl bg-emerald-50 p-6 text-center">
                <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2">Score</p>
                <p className="text-3xl font-black text-emerald-600">{diagnostic.score} / 20</p>
              </div>
            </div>

            <div className="grid gap-4 mb-8">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                <div className="flex items-center gap-3 mb-2">
                  <BarChart2 className="h-5 w-5 text-indigo-500" />
                  <p className="font-bold text-slate-900">Headline insight</p>
                </div>
                <p className="text-sm text-slate-600">
                  {diagnostic.ai_summary || `The latest baseline highlighted ${latestTopic} as a key area to build on next.`}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                <p className="font-bold text-slate-900 mb-1">Current focus signal</p>
                <p className="text-sm text-slate-600">
                  Latest topic data points to <span className="font-bold text-slate-800">{latestTopic}</span> as one of the clearest places to keep improving before the next retake.
                </p>
              </div>
            </div>

            <Link
              href="/diagnostic"
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-8 py-4 font-bold text-white hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
            >
              Retake Diagnostic
              <RotateCcw className="h-5 w-5" />
            </Link>
          </section>

          <section className="bg-indigo-50 rounded-[2.5rem] p-8 border border-indigo-100">
            <div className="h-12 w-12 rounded-2xl bg-white text-indigo-600 flex items-center justify-center mb-5 shadow-sm">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-3">What this page is for</h3>
            <p className="text-sm text-slate-600 mb-5">
              Use this as the home for the latest baseline. It helps you quickly review the current picture before deciding whether it&apos;s time to measure progress again.
            </p>
            <div className="rounded-2xl bg-white/70 border border-white px-5 py-4 text-sm text-slate-600">
              A retake is most meaningful after a solid block of practice. The dashboard and practice hubs are where the day-to-day work happens; this page is the checkpoint.
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
