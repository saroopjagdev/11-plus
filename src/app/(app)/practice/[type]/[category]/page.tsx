import { createClient } from '@/lib/supabase/server'
import { hasProAccess } from '@/lib/entitlements'
import {
} from '@/lib/mastery'
import { PracticeSession } from '@/components/PracticeSession'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Lock, Clock, Target, Play } from 'lucide-react'
import { MockSimulator } from '@/components/MockSimulator'
import { cn } from '@/lib/utils'
import { shuffleArray } from '@/lib/random'

interface PageProps {
  params: Promise<{
    type: string
    category: string
  }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

type MockQuestion = {
  id: string
  question_text: string
  options: string[]
  correct_answer: string
  subject: string
  topic: string
  type?: string
  difficulty?: 'Easy' | 'Medium' | 'Hard'
  passage?: {
    title: string
    content: string
  }
}

const MOCK_SUBJECT_OPTIONS = ['Maths', 'English', 'Verbal Reasoning', 'Mixed'] as const

function getMockDifficultyTargets(limit: number) {
  const easy = Math.max(1, Math.round(limit * 0.3))
  const medium = Math.max(1, Math.round(limit * 0.35))
  const hard = Math.max(1, limit - easy - medium)

  return { easy, medium, hard }
}

function takeBalancedQuestions(
  easyQuestions: MockQuestion[],
  mediumQuestions: MockQuestion[],
  hardQuestions: MockQuestion[],
  limit: number
) {
  const shuffledEasy = shuffleArray(easyQuestions)
  const shuffledMedium = shuffleArray(mediumQuestions)
  const shuffledHard = shuffleArray(hardQuestions)
  const targets = getMockDifficultyTargets(limit)
  const selected: MockQuestion[] = []
  const usedIds = new Set<string>()

  const takeFromPool = (pool: MockQuestion[], count: number) => {
    for (const question of pool) {
      if (selected.length >= limit) break
      if (count <= 0) break
      if (usedIds.has(question.id)) continue
      selected.push(question)
      usedIds.add(question.id)
      count -= 1
    }
  }

  takeFromPool(shuffledEasy, targets.easy)
  takeFromPool(shuffledMedium, targets.medium)
  takeFromPool(shuffledHard, targets.hard)

  const remaining = shuffleArray([...shuffledEasy, ...shuffledMedium, ...shuffledHard]).filter(
    (question) => !usedIds.has(question.id)
  )

  for (const question of remaining) {
    if (selected.length >= limit) break
    selected.push(question)
    usedIds.add(question.id)
  }

  return shuffleArray(selected)
}

export default async function PracticeSessionPage({ params, searchParams }: PageProps) {
  const { type, category } = await params
  const sParams = await searchParams
  const supabase = await createClient()

  // 1. Auth check
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) redirect('/login')

  // 2. Pro check for Mocks
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_status')
    .eq('id', user.id)
    .single()
  const isPro = hasProAccess(profile)

  // 3. Fetch Child
  const { data: children } = await supabase.from('children').select('id').eq('parent_id', user.id).limit(1)
  const childId = children?.[0]?.id

  if (type === 'mock' && !isPro) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
        <div className="bg-white p-10 rounded-[3rem] shadow-2xl border-2 border-indigo-50 max-w-md">
           <div className="h-16 w-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Lock className="h-8 w-8 text-indigo-600" />
           </div>
           <h2 className="text-2xl font-black text-slate-800 mb-4">Precision Mocks are Pro Only</h2>
           <p className="text-slate-500 mb-8">Timed, 40-question mock exams are available for our premium members. Boost your child&apos;s exam stamina today!</p>
           <Link href="/pricing" className="block w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-slate-900 transition-all">
              Upgrade to Pro
           </Link>
           <Link href="/dashboard" className="block mt-4 text-sm font-bold text-slate-400">
              Maybe Later
           </Link>
        </div>
      </div>
    )
  }

  // 3. Fetch Questions or Show Setup Screen
  const decodedCategory = decodeURIComponent(category)
  const length = parseInt(sParams.length as string)
  const mode = sParams.mode as string
  const difficulty = sParams.difficulty as string
  const start = sParams.start === 'true'

  // If we're in 'topic' mode and haven't explicitly clicked START, show the Prep Screen
  if (type === 'topic' && !start) {
    const isMission = sParams.mission === 'true'
    const finalLength = isMission ? 10 : (length || 10)

    // SKIP PREP SCREEN FOR MISSIONS
    if (isMission) {
       // We can't use redirect() here easily because we're already in a server component rendering.
       // Instead, we'll just fall through to the question fetching logic below.
       // We'll set 'start' to true effectively by skipping this block.
    } else {
      const { data: topicMastery } = await supabase
        .from('topic_mastery')
        .select('accuracy, questions_answered, mastery_level')
        .eq('child_id', childId)
        .ilike('topic', decodedCategory)
        .maybeSingle()

      // Check if written questions even exist for this topic
      const { count: writtenCount } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .ilike('topic', decodedCategory)
        .eq('type', 'written')

      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-white p-10 rounded-[3.5rem] shadow-2xl border-2 border-indigo-50 max-w-2xl w-full">
            <div className="flex items-center justify-between mb-8">
              <Link href="/dashboard" className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-600 transition-colors">
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div className="px-6 py-2 bg-indigo-50 text-indigo-600 rounded-2xl font-black text-xs uppercase tracking-widest">
                Topic Prep
              </div>
              <div className="w-12 h-12" /> {/* Spacer */}
            </div>

            <header className="mb-10">
              <h2 className="text-4xl font-black text-slate-900 mb-2">{decodedCategory}</h2>
              <p className="text-slate-500 font-medium italic">&ldquo;Every expert was once a beginner.&rdquo;</p>
            </header>

            {topicMastery && (
              <div className="mb-10 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                <div className="flex items-center justify-between mb-3 px-2">
                   <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Your Mastery</span>
                   <span className="text-sm font-black text-indigo-600">{topicMastery.accuracy}%</span>
                </div>
                <div className="h-3 w-full bg-white rounded-full overflow-hidden border border-slate-100">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${topicMastery.accuracy}%` }} />
                </div>
                <p className="mt-3 text-xs font-bold text-slate-500">
                  {topicMastery.questions_answered || 0} questions logged so far
                </p>
              </div>
            )}

            <form action="" className="space-y-8 text-left">
              {/* Length Selection */}
              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 block px-2">Session Length</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { val: 10, label: '10 Qs', desc: 'Quick' },
                    { val: 25, label: '25 Qs', desc: 'Standard' },
                    { val: 50, label: '50 Qs', desc: 'Stamina', pro: true }
                  ].map(opt => (
                    <Link
                      key={opt.val}
                      href={`?length=${opt.val}&mode=${mode || 'balanced'}&difficulty=${difficulty || 'Mixed'}`}
                      className={cn(
                        "p-4 rounded-2xl border-2 transition-all group relative",
                        finalLength === opt.val ? "border-indigo-600 bg-indigo-50" : "border-slate-100 bg-white hover:border-indigo-200"
                      )}
                    >
                      <p className="font-black text-slate-900">{opt.label}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">{opt.desc}</p>
                      {opt.pro && !isPro && <Lock className="absolute top-2 right-2 h-3 w-3 text-slate-300" />}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Mode Selection - Only show if there are both types */}
              {(writtenCount || 0) > 0 && (
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 block px-2">Practice Mode</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { val: 'balanced', label: 'Balanced', desc: 'Mixed' },
                      { val: 'mcq', label: 'MCQ Only', desc: 'Speed' },
                      { val: 'written', label: 'Written', desc: 'Pro Only', pro: true }
                    ].map(opt => (
                      <Link
                        key={opt.val}
                        href={`?length=${finalLength}&mode=${opt.val}&difficulty=${difficulty || 'Mixed'}`}
                        className={cn(
                          "p-4 rounded-2xl border-2 transition-all relative",
                          (mode === opt.val || (!mode && opt.val === 'balanced')) ? "border-indigo-600 bg-indigo-50" : "border-slate-100 bg-white hover:border-indigo-200"
                        )}
                      >
                        <p className="font-black text-slate-900">{opt.label}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase">{opt.desc}</p>
                        {opt.pro && !isPro && <Lock className="absolute top-2 right-2 h-3 w-3 text-slate-300" />}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <Link 
                href={`?length=${finalLength}&mode=${mode || 'balanced'}&difficulty=${difficulty || 'Mixed'}&start=true`}
                className="block w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black text-xl hover:bg-indigo-600 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 group"
              >
                Start Session
                <Play className="h-6 w-6 fill-current group-hover:translate-x-1 transition-transform" />
              </Link>
            </form>
          </div>
        </div>
      )
    }
  }

  // 3. Fetch Questions based on Type
  let query = supabase.from('questions').select('*, passage:passages(*)')
  let limit = length || 10

  if (type === 'topic') {
    query = query.ilike('topic', decodedCategory)
    if (mode === 'written') query = query.eq('type', 'written')
    if (mode === 'mcq') query = query.eq('type', 'mcq')
  } else if (type === 'drill') {
    query = query.ilike('subject', decodedCategory)
    limit = 15
  } else if (type === 'mock') {
    const requestedLength = sParams.length
    if (!requestedLength) {
      // Show Settings Screen
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
          <div className="bg-white p-10 rounded-[3rem] shadow-2xl border-2 border-indigo-50 max-w-lg w-full">
             <div className="h-16 w-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Target className="h-8 w-8 text-indigo-600" />
             </div>
             <h2 className="text-3xl font-black text-slate-900 mb-2">Mock Exam Setup</h2>
             <p className="text-slate-500 mb-8">Choose a subject or go mixed, then start a timed paper with a balanced spread of Easy, Medium, and Hard questions.</p>

             <div className="mb-8 text-left">
               <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 block px-2">Subject</label>
               <div className="grid grid-cols-2 gap-3">
                 {MOCK_SUBJECT_OPTIONS.map((subjectOption) => (
                   <Link
                     key={subjectOption}
                     href={`/practice/mock/${encodeURIComponent(subjectOption)}`}
                     className={cn(
                       "p-4 rounded-2xl border-2 transition-all",
                       decodedCategory === subjectOption
                         ? "border-indigo-600 bg-indigo-50"
                         : "border-slate-100 bg-white hover:border-indigo-200"
                     )}
                   >
                     <p className="font-black text-slate-900">{subjectOption}</p>
                     <p className="text-[10px] text-slate-500 font-bold uppercase">
                       {subjectOption === 'Mixed' ? 'All subjects' : 'Single subject'}
                     </p>
                   </Link>
                 ))}
               </div>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
               <Link href={`?length=20`} className="p-6 bg-slate-50 rounded-2xl border-2 border-slate-100 hover:border-indigo-600 hover:bg-indigo-50 transition-colors group text-left">
                 <div className="flex items-center gap-2 text-indigo-600 font-black text-sm uppercase tracking-widest mb-2">
                   <Clock className="h-4 w-4" /> Half Mock
                 </div>
                 <p className="font-bold text-slate-900 text-lg">20 Questions</p>
                 <p className="text-slate-500 text-sm">10 Minutes</p>
               </Link>
               <Link href={`?length=40`} className="p-6 bg-slate-50 rounded-2xl border-2 border-slate-100 hover:border-indigo-600 hover:bg-indigo-50 transition-colors group text-left">
                 <div className="flex items-center gap-2 text-indigo-600 font-black text-sm uppercase tracking-widest mb-2">
                   <Clock className="h-4 w-4" /> Full Mock
                 </div>
                 <p className="font-bold text-slate-900 text-lg">40 Questions</p>
                 <p className="text-slate-500 text-sm">20 Minutes</p>
               </Link>
             </div>

             <Link href="/dashboard" className="block text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors">
                Back to Dashboard
             </Link>
          </div>
        </div>
      )
    }
    
    limit = parseInt(requestedLength as string) || 40
  }

  // Handle difficulty filter if present in URL
  const diffParam = sParams.difficulty
  if (type !== 'mock' && diffParam && typeof diffParam === 'string' && diffParam !== 'Mixed') {
    query = query.eq('difficulty', diffParam)
  }

  let shuffled: MockQuestion[] = []

  if (type === 'mock') {
    const poolSize = Math.max(limit * 2, 30)
    const subjectFilter = decodedCategory !== 'Mixed' ? decodedCategory : null
    const selectClause = '*, passage:passages(*)'

    const buildDifficultyQuery = (difficultyName: 'Easy' | 'Medium' | 'Hard') => {
      let difficultyQuery = supabase
        .from('questions')
        .select(selectClause)
        .eq('difficulty', difficultyName)
        .limit(poolSize)

      if (subjectFilter) {
        difficultyQuery = difficultyQuery.ilike('subject', subjectFilter)
      }

      return difficultyQuery
    }

    const [easyPool, mediumPool, hardPool] = await Promise.all([
      buildDifficultyQuery('Easy'),
      buildDifficultyQuery('Medium'),
      buildDifficultyQuery('Hard'),
    ])

    const mockError = easyPool.error || mediumPool.error || hardPool.error
    if (mockError) {
      console.error('Mock query error:', mockError)
      redirect('/dashboard?error=no_questions')
    }

    const balancedQuestions = takeBalancedQuestions(
      (easyPool.data || []) as MockQuestion[],
      (mediumPool.data || []) as MockQuestion[],
      (hardPool.data || []) as MockQuestion[],
      limit
    )

    if (balancedQuestions.length === 0) {
      console.log('Redirecting to dashboard due to 0 mock questions found for:', decodedCategory)
      redirect('/dashboard?error=no_questions')
    }

    shuffled = balancedQuestions
  } else {
    const { data: questions, error } = await query.limit(limit)
    console.log('Questions found:', questions?.length || 0)
    if (error) console.error('Query Error:', error)

    if (error || !questions || questions.length === 0) {
      console.log('Redirecting to dashboard due to 0 questions found for:', decodedCategory)
      redirect('/dashboard?error=no_questions')
    }

    shuffled = shuffleArray(questions as MockQuestion[])
  }

  return (
    <div className="h-[100dvh] bg-slate-50 overflow-hidden">
      {type === 'mock' ? (
        <MockSimulator 
          questions={shuffled} 
          timeLimit={limit === 40 ? 20 : 10} 
          childId={childId}
          isPro={isPro}
        />
      ) : (
        <PracticeSession 
          questions={shuffled} 
          timeLimit={undefined} 
          childId={childId}
          isPro={isPro}
        />
      )}
    </div>
  )
}
