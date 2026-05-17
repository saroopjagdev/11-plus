import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ClaimResultsPrompt } from '@/components/ClaimResultsPrompt'
import { MasteryBar } from '@/components/MasteryBar'
import { DashboardTips } from '@/components/DashboardTips'
import { DashboardStudentProfile } from '@/components/DashboardStudentProfile'
import { GoalCountdown } from '@/components/GoalCountdown'
import { RoadmapTabs } from '@/components/RoadmapTabs'
import { DailyMission } from '@/components/DailyMission'
import { DashboardOnboardingTrigger } from '@/components/onboarding/DashboardOnboardingTrigger'
import { getStudentRecommendations } from '@/lib/recommendations'
import { Zap, Target, Star, ArrowUpRight, BookOpen, Brain, BarChart3, Lock, ChevronRight, Clock } from 'lucide-react'
import { CURRICULUM_LADDER, MASTERY_THRESHOLD, MIN_QUESTIONS_FOR_MASTERY } from '@/lib/constants/curriculum'
import { cn } from '@/lib/utils'



export const dynamic = 'force-dynamic'

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

  const { data: masteryData } = childId 
    ? await supabase.from('topic_mastery').select('*').eq('child_id', childId)
    : { data: [] }
  
  const mastery = masteryData || []

  const { data: diagnostic } = childId
    ? await supabase.from('diagnostic_results').select('*').eq('child_id', childId).order('created_at', { ascending: false }).limit(1).maybeSingle()
    : { data: null }

  const recommendations = childId ? await getStudentRecommendations(supabase, childId) : []

  // 3. Check for Mission Completion (only count 'practice' sessions today)
  const today = new Date().toISOString().split('T')[0]
  const { data: todaySessions } = childId
    ? await supabase
        .from('sessions')
        .select('topic')
        .eq('child_id', childId)
        .eq('type', 'practice')
        .gte('completed_at', today)
    : { data: [] }

  const completedTopics = Array.from(new Set(todaySessions?.map(s => s.topic).filter(Boolean) || [])) as string[]
  const missionsComplete = recommendations.length > 0 && recommendations.every(rec => completedTopics.includes(rec.topic))

  return (
    <div className="min-h-screen bg-slate-50">
      
      {childId && <ClaimResultsPrompt childId={childId} />}
      
      {children?.[0] && (
        <DashboardOnboardingTrigger 
          childId={children[0].id}
          childName={children[0].name}
          hasCompletedOnboarding={children[0].has_completed_onboarding}
        />
      )}

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

            {/* Today's Mission & Roadmap */}
            <div className="space-y-6">
               {recommendations.length > 0 && (
                 <div className="space-y-4">
                   <div className="flex items-center justify-between px-2">
                      <div className="flex items-center gap-2">
                         <Clock className="h-4 w-4 text-slate-400" />
                         <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Daily Goal: 30 Mins</span>
                      </div>
                      <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md uppercase">
                         {missionsComplete ? "Target Reached! ✨" : `${Math.min(100, Math.round((completedTopics.length / (recommendations.length || 3)) * 100))}% toward goal`}
                      </span>
                   </div>
                   <DailyMission 
                     recommendations={recommendations} 
                     childName={children?.[0]?.name || 'Student'} 
                     isComplete={missionsComplete}
                     completedTopics={completedTopics}
                   />
                 </div>
               )}
            </div>

            {/* Learning Journey Hubs */}
            <RoadmapTabs 
              mastery={mastery}
              curriculum={CURRICULUM_LADDER}
              threshold={MASTERY_THRESHOLD}
              minQuestions={MIN_QUESTIONS_FOR_MASTERY}
              isPro={profile?.subscription_status === 'pro'}
            />

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
             {children?.[0] && (
               <GoalCountdown 
                 examDate={children?.[0]?.exam_date}
                 childName={children?.[0]?.name || 'Student'} 
               />
             )}

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
