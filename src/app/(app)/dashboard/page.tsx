import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ClaimResultsPrompt } from '@/components/ClaimResultsPrompt'
import { MasteryBar } from '@/components/MasteryBar'
import { DashboardTips } from '@/components/DashboardTips'
import { DashboardStudentProfile } from '@/components/DashboardStudentProfile'
import { getStudentRecommendations } from '@/lib/recommendations'
import { Zap, Target, Star, ArrowUpRight, BookOpen, Brain, BarChart3, Lock, ChevronRight } from 'lucide-react'

function HubCard({ title, color, icon, items, isPro }: { title: string, color: string, icon: React.ReactNode, items: any[], isPro: boolean }) {
  const colors: Record<string, string> = {
    indigo: 'bg-indigo-50 border-indigo-100 text-indigo-900',
    violet: 'bg-violet-50 border-violet-100 text-violet-900',
    amber: 'bg-amber-50 border-amber-100 text-amber-900'
  }

  return (
    <div className={`p-6 rounded-[2rem] border ${colors[color]} space-y-4 shadow-sm`}>
      <div className="flex items-center gap-3">
        <div className="p-2 bg-white rounded-xl shadow-sm">
          {icon}
        </div>
        <h3 className="font-bold text-lg">{title}</h3>
      </div>
      
      <div className="space-y-2">
        {items.map((item, i) => (
          <Link 
            key={i} 
            href={item.href}
            className="flex items-center justify-between p-3 bg-white/50 hover:bg-white rounded-xl text-sm font-bold transition-all group"
          >
            <div className="flex items-center gap-2">
              {item.label}
              {item.pro && !isPro && <Lock className="h-3 w-3 text-slate-400" />}
            </div>
            <ChevronRight className="h-4 w-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
          </Link>
        ))}
      </div>
    </div>
  )
}

export default async function DashboardPage() {
  const supabase = await createClient()

  // 1. Check if user is logged in
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/login')
  }

  // 2. Fetch profile and children
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: children } = await supabase
    .from('children')
    .select('*')
    .eq('parent_id', user.id)

  const childId = children?.[0]?.id

  const { data: mastery } = childId 
    ? await supabase.from('topic_mastery').select('*').eq('child_id', childId)
    : { data: [] }

  const { data: diagnostic } = childId
    ? await supabase.from('diagnostic_results').select('*').eq('child_id', childId).order('created_at', { ascending: false }).limit(1).maybeSingle()
    : { data: null }

  const recommendations = childId ? await getStudentRecommendations(supabase, childId) : []

  return (
    <div className="min-h-screen bg-slate-50">
      
      {childId && <ClaimResultsPrompt childId={childId} />}

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-black text-slate-900 mb-1">Welcome back, {children?.[0]?.name || 'Explorer'}! 👋</h1>
                <p className="text-slate-500 font-medium">Ready to boost those 11+ scores today?</p>
              </div>
              {children?.[0] && (
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm">
                   <Star className="h-4 w-4 text-amber-500 fill-current" />
                   <span className="text-sm font-bold text-slate-700">{children[0].total_points} XP</span>
                </div>
              )}
            </header>

            {/* AI Recommendations */}
            {recommendations.length > 0 && (
              <section className="bg-indigo-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
                <div className="relative z-10">
                  <div className="flex items-center gap-2 text-indigo-200 font-black text-[10px] uppercase tracking-widest mb-6">
                    <Zap className="h-3 w-3 fill-current" />
                    Recommended Next Steps
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recommendations.map((rec, i) => (
                      <Link 
                        key={i} 
                        href={rec.action.href}
                        className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 p-5 rounded-3xl transition-all flex items-center justify-between group/rec"
                      >
                        <div>
                           <p className="text-indigo-200 text-[10px] font-black uppercase mb-1">{rec.type === 'weakness' ? 'Focus Area' : 'Growth Area'}</p>
                           <p className="font-bold text-lg leading-tight">{rec.topic}</p>
                        </div>
                        <div className="h-10 w-10 bg-white/10 rounded-full flex items-center justify-center group-hover/rec:bg-white/100 group-hover/rec:text-indigo-600 transition-all">
                           <ArrowUpRight className="h-5 w-5" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
                {/* Decorative */}
                <div className="absolute -right-20 -top-20 h-64 w-64 bg-indigo-400/20 rounded-full blur-[80px]" />
              </section>
            )}

            {/* Learning Hubs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <HubCard 
                title="Mathematics" 
                color="indigo" 
                icon={<BookOpen className="h-6 w-6 text-indigo-600" />}
                items={[
                  { label: 'Full Mock Test', href: '/practice/mock/Maths', pro: true },
                  { label: 'Daily Drill (Mixed)', href: '/practice/drill/Maths' },
                  { label: 'Fractions Master', href: '/practice/topic/Fractions' },
                  { label: 'Geometry Basics', href: '/practice/topic/Geometry' },
                ]}
                isPro={profile?.subscription_status === 'pro'}
              />
              <HubCard 
                title="English" 
                color="violet" 
                icon={<BookOpen className="h-6 w-6 text-violet-600" />}
                items={[
                  { label: 'Full Mock Test', href: '/practice/mock/English', pro: true },
                  { label: 'Vocabulary Drill', href: '/practice/drill/English' },
                  { label: 'Synonyms topic', href: '/practice/topic/Synonyms' },
                  { label: 'Spelling practice', href: '/practice/topic/Spelling' },
                ]}
                isPro={profile?.subscription_status === 'pro'}
              />
              <HubCard 
                title="Reasoning" 
                color="amber" 
                icon={<Brain className="h-6 w-6 text-amber-600" />}
                items={[
                  { label: 'Verbal Mock', href: '/practice/mock/Verbal Reasoning', pro: true },
                  { label: 'Logic Drills', href: '/practice/drill/Verbal Reasoning' },
                ]}
                isPro={profile?.subscription_status === 'pro'}
              />
            </div>

            {/* Topic Mastery Section */}
            <section className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900">Topic Mastery</h3>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Live Progress</span>
              </div>
              
              {mastery && mastery.length > 0 ? (
                <div className="space-y-6">
                  {mastery.map((item) => (
                    <MasteryBar 
                      key={item.id} 
                      label={item.topic} 
                      progress={item.accuracy} 
                      color={item.accuracy >= 70 ? 'bg-emerald-500' : 'bg-indigo-500'} 
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                  <p className="text-slate-400 text-sm font-medium">No practice data yet. Start your first session!</p>
                </div>
              )}
            </section>

            {/* Diagnostic Results Section */}
            {diagnostic && (
              <section className="bg-amber-50 rounded-3xl p-8 border border-amber-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-amber-900">Last Diagnostic</h3>
                  <span className="bg-amber-200 text-amber-800 px-3 py-1 rounded-full text-[10px] font-bold uppercase">Baseline Set</span>
                </div>
                <div className="flex items-center gap-6">
                  <div className="bg-white p-4 rounded-2xl shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Score</p>
                    <p className="text-2xl font-black text-slate-900">{diagnostic.score} / 20</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-amber-800 font-medium mb-2">Strengths identified in {diagnostic.topic_breakdown[0]?.topic || 'Maths'}.</p>
                    <Link href="/diagnostic" className="text-xs font-bold text-amber-600 underline underline-offset-4 decoration-2">Retake Diagnostic</Link>
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* Right Sidebar Section (Secondary Stats) */}
          <div className="space-y-8">
             <DashboardTips />

             <section className="space-y-4">
                {children && children[0] ? (
                   <DashboardStudentProfile child={children[0]} />
                ) : (
                   <div className="bg-indigo-50 rounded-3xl p-8 border border-indigo-100 text-center">
                      <p className="text-sm text-indigo-600 mb-4">No students added yet.</p>
                      <Link 
                        href="/dashboard/add-student"
                        className="block w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 transition shadow-lg shadow-indigo-100 text-center"
                      >
                        Register Your Child
                      </Link>
                   </div>
                )}
             </section>
          </div>
        </div>
      </main>
    </div>
  )
}


function ArrowRight({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  )
}
