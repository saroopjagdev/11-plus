import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AnalyticsCharts } from '@/components/analytics/AnalyticsCharts'
import { BarChart3, TrendingUp, Target, Award } from 'lucide-react'
import { getMasteryStatusLabel, getMasteryTier } from '@/lib/mastery'
import { CANONICAL_SUBJECTS, normalizeSubjectAndTopic } from '@/lib/tracking'
import { ReportIssueButton } from '@/components/ReportIssueButton'

export default async function AnalyticsPage() {
  const supabase = await createClient()

  // 1. Auth Check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 2. Fetch Children
  const { data: children } = await supabase
    .from('children')
    .select('*')
    .eq('parent_id', user.id)

  if (!children || children.length === 0) {
    redirect('/dashboard')
  }

  const childId = children[0].id

  // 3. Fetch Sessions for Trend
  const { data: sessions } = await supabase
    .from('sessions')
    .select('id, score, completed_at, type')
    .eq('child_id', childId)
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: true })
    .limit(30)

  // 4. Fetch Mastery for Radar
  const { data: mastery } = await supabase
    .from('topic_mastery')
    .select('subject, accuracy, questions_answered')
    .eq('child_id', childId)

  // 5. Fetch recent attempts and join with questions for accurate trend/subject analytics
  const { data: attempts } = await supabase
    .from('question_attempts')
    .select(`
      session_id,
      is_correct,
      time_taken_seconds,
      questions (subject, topic)
    `)
    .eq('child_id', childId)
    .order('created_at', { ascending: false })
    .limit(500)

  const attemptsBySession = new Map<string, { correct: number; total: number }>()
  const subjectTotals: Record<string, { correct: number; total: number; speedTotal: number; speedCount: number }> = {
    Maths: { correct: 0, total: 0, speedTotal: 0, speedCount: 0 },
    English: { correct: 0, total: 0, speedTotal: 0, speedCount: 0 },
    'Verbal Reasoning': { correct: 0, total: 0, speedTotal: 0, speedCount: 0 },
  }

  attempts?.forEach((attempt: {
    session_id: string | null
    is_correct: boolean | null
    time_taken_seconds: number | null
    questions?: { subject?: string | null; topic?: string | null }[] | null
  }) => {
    const questionMeta = attempt.questions?.[0]
    const { subject } = normalizeSubjectAndTopic(questionMeta?.subject, questionMeta?.topic)

    if (subjectTotals[subject]) {
      subjectTotals[subject].total += 1
      if (attempt.is_correct) {
        subjectTotals[subject].correct += 1
      }
      if ((attempt.time_taken_seconds || 0) > 0) {
        subjectTotals[subject].speedTotal += attempt.time_taken_seconds || 0
        subjectTotals[subject].speedCount += 1
      }
    }

    if (!attempt.session_id) return

    const existingSession = attemptsBySession.get(attempt.session_id) || { correct: 0, total: 0 }
    existingSession.total += 1
    if (attempt.is_correct) {
      existingSession.correct += 1
    }
    attemptsBySession.set(attempt.session_id, existingSession)
  })

  const trendData = sessions?.map((session) => {
    const sessionAttempts = attemptsBySession.get(session.id || '')
    const totalQuestions =
      sessionAttempts?.total || (session.type === 'diagnostic' ? 20 : session.score && session.score > 0 ? session.score : 0)
    const correctAnswers = sessionAttempts?.correct ?? (session.score || 0)

    return {
      date: new Date(session.completed_at!).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      accuracy: totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0,
    }
  }) || []

  const subjectData = CANONICAL_SUBJECTS.map((subject) => ({
    subject,
    accuracy:
      subjectTotals[subject].total > 0
        ? Math.round((subjectTotals[subject].correct / subjectTotals[subject].total) * 100)
        : 0,
    fullMark: 100,
  }))

  const speedData = CANONICAL_SUBJECTS.map((subject) => ({
    subject,
    avgTime:
      subjectTotals[subject].speedCount > 0
        ? Math.round(subjectTotals[subject].speedTotal / subjectTotals[subject].speedCount)
        : 0,
    targetTime: 30 // 11+ standard is ~30s
  }))
  const strongestTier =
    [...(mastery || [])]
      .sort((left, right) => (getMasteryTier(right)?.level || 0) - (getMasteryTier(left)?.level || 0))[0] || null
  const masteryHeadline = strongestTier ? getMasteryStatusLabel(strongestTier) : 'Not started'

  return (
    <div className="p-8 lg:p-12 max-w-6xl mx-auto">
      <header className="mb-12">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Performance Hub</h1>
        <p className="text-slate-500">In-depth analysis of {children[0].name}&apos;s learning journey.</p>
        <div className="mt-3">
          <ReportIssueButton
            category="Tracking looks wrong"
            userEmail={user.email}
            childId={childId}
            context={{
              pageLabel: 'Performance Hub',
              trendPoints: trendData.length,
              totalAttempts: attempts?.length || 0,
            }}
          />
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <StatsCard 
          label="Total Questions" 
          value={attempts?.length || 0} 
          icon={<Target className="h-5 w-5 text-indigo-600" />} 
          color="bg-indigo-50"
        />
        <StatsCard 
          label="Avg. Accuracy" 
          value={`${Math.round(subjectData.reduce((acc, s) => acc + s.accuracy, 0) / subjectData.length || 0)}%`} 
          icon={<TrendingUp className="h-5 w-5 text-emerald-600" />} 
          color="bg-emerald-50"
        />
        <StatsCard 
          label="Sessions" 
          value={sessions?.length || 0} 
          icon={<BarChart3 className="h-5 w-5 text-violet-600" />} 
          color="bg-violet-50"
        />
        <StatsCard 
          label="Level" 
          value={masteryHeadline}
          icon={<Award className="h-5 w-5 text-amber-600" />} 
          color="bg-amber-50"
        />
      </div>

      <AnalyticsCharts trendData={trendData} subjectData={subjectData} speedData={speedData} />
    </div>
  )
}

function StatsCard({ label, value, icon, color }: { label: string, value: string | number, icon: React.ReactNode, color: string }) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
      <div className={`h-10 w-10 ${color} rounded-xl flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-2xl font-black text-slate-900 leading-tight">{value}</p>
    </div>
  )
}
