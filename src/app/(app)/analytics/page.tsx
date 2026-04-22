import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AnalyticsCharts } from '@/components/analytics/AnalyticsCharts'
import { BarChart3, TrendingUp, Target, Award } from 'lucide-react'

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
    .select('score, completed_at, type')
    .eq('child_id', childId)
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: true })
    .limit(30)

  // 4. Fetch Mastery for Radar
  const { data: mastery } = await supabase
    .from('topic_mastery')
    .select('subject, accuracy')
    .eq('child_id', childId)

  // Format Trend Data: Assuming sessions are 10 questions each for score %
  const trendData = sessions?.map(s => ({
    date: new Date(s.completed_at!).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
    accuracy: (s.score / (s.type === 'diagnostic' ? 20 : 10)) * 100
  })) || []

  // Format Subject Data: Aggregate by subject
  const subjectTotals: Record<string, { total: number; count: number }> = {
    'Maths': { total: 0, count: 0 },
    'English': { total: 0, count: 0 },
    'Verbal Reasoning': { total: 0, count: 0 }
  }

  mastery?.forEach(m => {
    if (subjectTotals[m.subject]) {
      subjectTotals[m.subject].total += Number(m.accuracy)
      subjectTotals[m.subject].count += 1
    }
  })

  const subjectData = Object.keys(subjectTotals).map(s => ({
    subject: s,
    accuracy: subjectTotals[s].count > 0 ? Math.round(subjectTotals[s].total / subjectTotals[s].count) : 0,
    fullMark: 100
  }))

  // 5. Fetch Avg Speed per Subject
  // We'll fetch attempts and join with questions to get subject-wise speed
  const { data: attempts } = await supabase
    .from('question_attempts')
    .select(`
      time_taken_seconds,
      questions (subject)
    `)
    .eq('child_id', childId)
    .order('created_at', { ascending: false })
    .limit(100)

  const speedTotals: Record<string, { total: number; count: number }> = {
    'Maths': { total: 0, count: 0 },
    'English': { total: 0, count: 0 },
    'Verbal Reasoning': { total: 0, count: 0 }
  }

  attempts?.forEach((a: any) => {
    const subject = a.questions?.subject
    if (subject && speedTotals[subject]) {
      speedTotals[subject].total += a.time_taken_seconds || 0
      speedTotals[subject].count += 1
    }
  })

  const speedData = Object.keys(speedTotals).map(s => ({
    subject: s,
    avgTime: speedTotals[s].count > 0 ? Math.round(speedTotals[s].total / speedTotals[s].count) : 0,
    targetTime: 30 // 11+ standard is ~30s
  }))

  return (
    <div className="p-8 lg:p-12 max-w-6xl mx-auto">
      <header className="mb-12">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Performance Hub</h1>
        <p className="text-slate-500">In-depth analysis of {children[0].name}&apos;s learning journey.</p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <StatsCard 
          label="Total Questions" 
          value={mastery?.reduce((acc, m) => acc + (m as any).questions_answered, 0) || 0} 
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
          value="Bronze" 
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
