import { createClient } from '@/lib/supabase/server'
import { hasProAccess } from '@/lib/entitlements'
import { reconcileCheckoutSessionForUser } from '@/lib/subscription-server'
import { claimLeadDiagnosticForUser } from '@/app/actions/diagnostic'
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
import { Star, Clock, ClipboardCheck, ChevronRight } from 'lucide-react'
import { CURRICULUM_LADDER, MASTERY_THRESHOLD, MIN_QUESTIONS_FOR_MASTERY } from '@/lib/constants/curriculum'
import {
  getMasteryStatusLabel,
  getMasteryTier,
  getProgressToNextTier,
} from '@/lib/mastery'
import { normalizeTopic } from '@/lib/tracking'

export const dynamic = 'force-dynamic'
const MISSION_COMPLETION_MIN_ATTEMPTS = 8

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>
}) {
  const supabase = await createClient()

  // 1. Check if user is logged in
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/login')
  }

  const { session_id: sessionId } = await searchParams

  if (sessionId) {
    try {
      await reconcileCheckoutSessionForUser(sessionId, user.id)
    } catch (error) {
      console.error('Checkout return reconciliation failed:', error)
    }

    redirect('/dashboard')
  }

  // 2. Fetch profile and children
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  const profileHasAccess = hasProAccess(profile)

  const { data: children } = await supabase
    .from('children')
    .select('*')
    .eq('parent_id', user.id)

  const childId = children?.[0]?.id
  let shouldClearGuestCache = false

  if (childId) {
    try {
      const claimResult = await claimLeadDiagnosticForUser(user.id, childId)
      shouldClearGuestCache = claimResult.success
    } catch (error) {
      console.error('Diagnostic lead claim failed:', error)
    }
  }

  const { data: masteryData } = childId
    ? await supabase.from('topic_mastery').select('*').eq('child_id', childId)
    : { data: [] }

  const mastery = masteryData || []

  const { data: diagnostic } = childId
    ? await supabase.from('diagnostic_results').select('*').eq('child_id', childId).order('created_at', { ascending: false }).limit(1).maybeSingle()
    : { data: null }

  // 3. Check for Mission Completion (only count 'practice' sessions today)
  const today = new Date().toISOString().split('T')[0]

  // Today's 3 missions are pinned once computed, not recalculated on every
  // render. getStudentRecommendations() picks topics from *live*
  // topic_mastery (e.g. "current weakest topic"), and completing a mission
  // changes that very data — so recomputing fresh on each visit could swap
  // a slot to a different topic mid-day, making a genuinely-completed
  // mission look undone (it's checking attempts against the new topic, not
  // the one the child actually just practised).
  const pinnedChild = children?.[0]
  const hasPinnedMissionsToday =
    pinnedChild?.daily_mission_date === today &&
    Array.isArray(pinnedChild?.daily_mission_topics) &&
    pinnedChild.daily_mission_topics.length > 0

  let recommendations: Awaited<ReturnType<typeof getStudentRecommendations>> = []
  if (hasPinnedMissionsToday) {
    recommendations = pinnedChild.daily_mission_topics
  } else if (childId) {
    recommendations = await getStudentRecommendations(supabase, childId)
    if (recommendations.length > 0) {
      await supabase
        .from('children')
        .update({ daily_mission_date: today, daily_mission_topics: recommendations })
        .eq('id', childId)
    }
  }
  const { data: todaySessions } = childId
    ? await supabase
        .from('sessions')
        .select('id')
        .eq('child_id', childId)
        .eq('type', 'practice')
        .gte('completed_at', today)
    : { data: [] }

  // Used to stop the post-mission "Simulate an Exam" bonus card from
  // re-offering a mock the child already sat today — previously it showed
  // unconditionally any time missions were complete, with no memory of
  // whether that bonus had already been used, which read as the app
  // forgetting a mock they'd just finished.
  const { count: todayMockCount } = childId
    ? await supabase
        .from('sessions')
        .select('id', { count: 'exact', head: true })
        .eq('child_id', childId)
        .eq('type', 'mock')
        .gte('completed_at', today)
    : { count: 0 }
  const mockDoneToday = Boolean(todayMockCount && todayMockCount > 0)

  const todaySessionIds = todaySessions?.map((session) => session.id).filter(Boolean) || []
  const { data: todayAttempts } = childId && todaySessionIds.length > 0
    ? await supabase
        .from('question_attempts')
        .select(`
          is_correct,
          questions (
            topic
          )
        `)
        .eq('child_id', childId)
        .in('session_id', todaySessionIds)
    : { data: [] }

  const topicAttemptCounts = new Map<string, { attempts: number; correct: number }>()

  ;(todayAttempts || []).forEach((attempt: {
    is_correct?: boolean | null
    // Supabase returns the joined question as an object for a to-one FK, but can
    // return an array in other shapes. Handle both so the topic is never lost.
    questions?: { topic?: string | null } | { topic?: string | null }[] | null
  }) => {
    const joined = Array.isArray(attempt.questions) ? attempt.questions[0] : attempt.questions
    const topic = normalizeTopic(joined?.topic)
    if (!topic) return

    const existing = topicAttemptCounts.get(topic) || { attempts: 0, correct: 0 }
    existing.attempts += 1
    if (attempt.is_correct) {
      existing.correct += 1
    }
    topicAttemptCounts.set(topic, existing)
  })

  // Avoid marking a mission complete from a single accidental click or abandoned session.
  const completedTopics = recommendations
    .map((recommendation) => normalizeTopic(recommendation.topic))
    .filter((topic): topic is string => {
      if (!topic) return false
      const progress = topicAttemptCounts.get(topic)
      return Boolean(progress && progress.attempts >= MISSION_COMPLETION_MIN_ATTEMPTS && progress.correct > 0)
    })

  const completedTopicSet = new Set(completedTopics)
  const missionsComplete = recommendations.length > 0 && recommendations.every(rec => completedTopicSet.has(normalizeTopic(rec.topic)))
  const completedMissionCount = recommendations.filter((rec) => completedTopicSet.has(normalizeTopic(rec.topic))).length

  return (
    <div className="min-h-screen bg-slate-50">
      
      {childId && <ClaimResultsPrompt childId={childId} shouldClearGuestCache={shouldClearGuestCache} />}
      
      {children?.[0] && (
        <DashboardOnboardingTrigger 
          childId={children[0].id}
          childName={children[0].name}
          hasCompletedOnboarding={children[0].has_completed_onboarding}
        />
      )}

      <main className="max-w-6xl mx-auto px-4 py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <header className="flex items-center justify-between gap-4 pl-12 lg:pl-0">
              <div className="min-w-0">
                <h1 className="text-xl sm:text-3xl font-black text-slate-900 mb-1 truncate">Welcome back, {children?.[0]?.name || 'Explorer'}! 👋</h1>
                <p className="text-slate-500 font-medium text-sm sm:text-base">Ready to boost those 11+ scores today?</p>
              </div>
              {children?.[0] && (
                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-2xl border border-slate-100 shadow-sm shrink-0">
                   <Star className="h-4 w-4 text-amber-500 fill-current" />
                   <span className="text-sm font-bold text-slate-700">{children[0].total_points} XP</span>
                </div>
              )}
            </header>

            {/* Mock Exam shortcut — visible on mobile where the sidebar card is buried */}
            {profileHasAccess && (
              <Link
                href="/practice/mock/Mixed"
                className="flex items-center justify-between bg-indigo-600 text-white rounded-2xl px-6 py-4 lg:hidden hover:bg-indigo-500 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <ClipboardCheck className="h-5 w-5" />
                  <span className="font-black text-sm">Start a Mock Exam</span>
                </div>
                <ChevronRight className="h-5 w-5 opacity-70" />
              </Link>
            )}

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
                         {missionsComplete ? "Target Reached! ✨" : `${Math.min(100, Math.round((completedMissionCount / (recommendations.length || 3)) * 100))}% toward goal`}
                      </span>
                   </div>
                   <DailyMission
                     recommendations={recommendations}
                     childName={children?.[0]?.name || 'Student'}
                     isComplete={missionsComplete}
                      completedTopics={completedTopics}
                      isPro={profileHasAccess}
                      mockDoneToday={mockDoneToday}
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
              isPro={profileHasAccess}
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
                      progress={getProgressToNextTier(item)}
                      color={getMasteryTier(item) ? 'bg-emerald-500' : 'bg-indigo-500'}
                      status={getMasteryStatusLabel(item)}
                      accuracy={item.accuracy || 0}
                      evidence={`${item.questions_answered || 0} questions answered`}
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
            {childId && (
              <section className="bg-amber-50 rounded-3xl p-8 border border-amber-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-amber-900">Diagnostics</h3>
                  <span className="bg-amber-200 text-amber-800 px-3 py-1 rounded-full text-[10px] font-bold uppercase">
                    {diagnostic ? 'Baseline Set' : 'Start Here'}
                  </span>
                </div>
                <div className="flex items-center gap-6">
                  <div className="bg-white p-4 rounded-2xl shadow-sm min-w-[120px]">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      {diagnostic ? 'Score' : 'Status'}
                    </p>
                    <p className="text-2xl font-black text-slate-900">
                      {diagnostic ? `${diagnostic.score} / 20` : 'Not Taken'}
                    </p>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-amber-800 font-medium mb-2">
                      {diagnostic
                        ? `Latest baseline highlights ${diagnostic.topic_breakdown[0]?.topic || 'Maths'} as an area to keep building.`
                        : 'Take the baseline assessment to measure current level and unlock a clearer starting point.'}
                    </p>
                    <Link href="/diagnostics" className="text-xs font-bold text-amber-600 underline underline-offset-4 decoration-2">
                      {diagnostic ? 'View Latest Diagnostic' : 'Take Your Baseline'}
                    </Link>
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

             <section className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="relative z-10">
                  <div className="h-12 w-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-5">
                    <ClipboardCheck className="h-6 w-6 text-indigo-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Mock Exam Center</h3>
                  <p className="text-sm text-slate-500 mb-6">
                    {profileHasAccess
                      ? 'Build exam stamina with half and full timed mocks whenever your child is ready for a realistic simulation.'
                      : 'Timed mocks are one of the biggest score boosters. Upgrade to unlock full exam simulations and performance review.'}
                  </p>
                  <Link
                    href={profileHasAccess ? '/practice/mock/Mixed' : '/pricing'}
                    className="inline-flex items-center gap-2 text-indigo-700 font-black text-sm uppercase tracking-widest hover:gap-3 transition-all"
                  >
                    {profileHasAccess ? 'Start a Mock' : 'Unlock Mocks'}
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
                <div className="absolute -right-10 -bottom-10 h-32 w-32 bg-indigo-500/10 rounded-full blur-3xl" />
             </section>

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
