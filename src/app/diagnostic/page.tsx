import { createClient } from '@/lib/supabase/server'
import { DiagnosticSession } from '@/components/DiagnosticSession'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { CURRICULUM_LADDER } from '@/lib/constants/curriculum'
import { shuffleArray } from '@/lib/random'
import { answerKey } from '@/lib/adaptive'

interface DiagnosticQuestion {
  id: string
  question_text: string
  options: string[]
  correct_answer: string
  subject: string
  topic: string
  passage_id: string | null
  type?: string
}

function hasRenderableDiagnosticShape(question: DiagnosticQuestion | null | undefined) {
  return Boolean(
    question &&
      question.type === 'mcq' &&
      question.topic !== 'Comprehension' &&
      !question.passage_id &&
      question.question_text &&
      question.correct_answer &&
      Array.isArray(question.options) &&
      question.options.length >= 4
  )
}

export default async function DiagnosticPage() {
  const supabase = await createClient()

  // 1. Check for authenticated user/child (Optional)
  const { data: { user } } = await supabase.auth.getUser()
  let child = null

  if (user) {
    const { data: children } = await supabase
      .from('children')
      .select('*')
      .eq('parent_id', user.id)
      .limit(1)
    
    child = children?.[0]
  }

  // 3. Fetch a rigorous, comprehensive mix of questions
  // We need 4 Easy, 6 Medium, 10 Hard covering non-comprehension topics.
  
  // Shuffle topics to ensure different questions each time, excluding Comprehension
  const topics = CURRICULUM_LADDER
    .filter(t => t.topic !== 'Comprehension')
  const shuffledTopics = shuffleArray(topics)
  const easyTopics = shuffledTopics.slice(0, 4).map(t => t.topic)
  const mediumTopics = shuffledTopics.slice(4, 10).map(t => t.topic)
  const hardTopics = shuffledTopics.slice(10, 16).map(t => t.topic)

  // Fetch pools for each difficulty/topic group, ensuring no Comprehension or passage-tied questions.
  //
  // Only the columns actually consumed downstream — `select('*')` also dragged
  // along `explanation`, which is by far the widest column and is never read
  // here (the diagnostic shows no explanations) nor by DiagnosticSession. On a
  // six-topic pool that alone was ~40% of the payload.
  //
  // Every pool is bounded. Each (topic, difficulty) group currently holds at
  // most ~140 rows, so these caps are comfortably above what a request needs
  // (~100 candidates per topic to choose one from) while stopping the pools
  // scaling with the question bank — it grows continuously, and three of these
  // queries previously had no limit at all.
  const QUESTION_COLUMNS = 'id,question_text,options,correct_answer,subject,topic,passage_id,type'
  // .order('id') before .limit(): id is a random uuid, so this is an unbiased
  // sample rather than "whichever topic was generated first" (Postgres has
  // no obligation to return rows in any particular order without ORDER BY).
  // It also keeps the cap proportional across the topics in each pool, so no
  // topic gets starved of candidates by the limit.
  const [easyPool, mediumPool, hardPool, extraHardPool] = await Promise.all([
    supabase.from('questions').select(QUESTION_COLUMNS).in('topic', easyTopics).eq('difficulty', 'Easy').eq('type', 'mcq').is('passage_id', null).order('id', { ascending: true }).limit(400),
    supabase.from('questions').select(QUESTION_COLUMNS).in('topic', mediumTopics).eq('difficulty', 'Medium').eq('type', 'mcq').is('passage_id', null).order('id', { ascending: true }).limit(600),
    supabase.from('questions').select(QUESTION_COLUMNS).in('topic', hardTopics).eq('difficulty', 'Hard').eq('type', 'mcq').is('passage_id', null).order('id', { ascending: true }).limit(600),
    supabase.from('questions').select(QUESTION_COLUMNS).eq('difficulty', 'Hard').eq('type', 'mcq').neq('topic', 'Comprehension').is('passage_id', null).order('id', { ascending: true }).limit(40) // Extra pool for variety and filling gaps
  ])

  const selectedQuestions: DiagnosticQuestion[] = []
  const usedIds = new Set<string>()
  // Same-entry guard: a Hard-tier gap-filler (step 4 below) draws from every
  // Hard topic unrestricted, so without this it can silently reintroduce a
  // different-phrasing row of the same underlying entry (same topic +
  // correct_answer) already picked for that topic in step 3 — the exact
  // "same question again" bug, just inside the diagnostic instead of a
  // regular practice session.
  const usedAnswerKeys = new Set<string>()
  const addSelected = (q: DiagnosticQuestion) => {
    selectedQuestions.push(q)
    usedIds.add(q.id)
    const key = answerKey(q)
    if (key) usedAnswerKeys.add(key)
  }
  const easyData = shuffleArray((easyPool.data || []).filter(hasRenderableDiagnosticShape))
  const mediumData = shuffleArray((mediumPool.data || []).filter(hasRenderableDiagnosticShape))
  const hardData = shuffleArray((hardPool.data || []).filter(hasRenderableDiagnosticShape))
  const extraHardData = shuffleArray((extraHardPool.data || []).filter(hasRenderableDiagnosticShape))

  // Helper validation to ensure no passage-tied or comprehension questions slip through
  const isValidQuestion = (q: DiagnosticQuestion | null | undefined) => hasRenderableDiagnosticShape(q)

  // 1. Pick one Easy per easyTopic
  easyTopics.forEach(topic => {
    const q = easyData.find(q => q.topic === topic && !usedIds.has(q.id) && isValidQuestion(q))
    if (q) addSelected(q)
  })

  // 2. Pick one Medium per mediumTopic
  mediumTopics.forEach(topic => {
    const q = mediumData.find(q => q.topic === topic && !usedIds.has(q.id) && isValidQuestion(q))
    if (q) addSelected(q)
  })

  // 3. Pick one Hard per hardTopic
  hardTopics.forEach(topic => {
    const q = hardData.find(q => q.topic === topic && !usedIds.has(q.id) && isValidQuestion(q))
    if (q) addSelected(q)
  })

  // 4. Fill to 20 questions with Hard questions (prioritize topic variety).
  // Exclude same-entry rows first (a different stem testing the same
  // sentence/word already picked in step 3); only fall back to allowing one
  // if the pool is genuinely short, same principle as practice sessions.
  const remainingHardFresh = extraHardData.filter(q => {
    if (usedIds.has(q.id) || !isValidQuestion(q)) return false
    const key = answerKey(q)
    return !key || !usedAnswerKeys.has(key)
  })
  while (selectedQuestions.length < 20 && remainingHardFresh.length > 0) {
    const q = remainingHardFresh.shift()
    if (q) addSelected(q)
  }
  if (selectedQuestions.length < 20) {
    const remainingHardAny = extraHardData.filter(q => !usedIds.has(q.id) && isValidQuestion(q))
    while (selectedQuestions.length < 20 && remainingHardAny.length > 0) {
      const q = remainingHardAny.shift()
      if (q) addSelected(q)
    }
  }

  // Final fallback: if still not 20, just get any random ones (shouldn't happen with decent bank)
  if (selectedQuestions.length < 20) {
    const { data: fallback } = await supabase
      .from('questions')
      .select(QUESTION_COLUMNS)
      .eq('type', 'mcq')
      .neq('topic', 'Comprehension')
      .is('passage_id', null)
      .order('id', { ascending: true })
      .limit(60)

    shuffleArray((fallback || []).filter(hasRenderableDiagnosticShape)).forEach(q => {
      if (selectedQuestions.length >= 20 || usedIds.has(q.id) || !isValidQuestion(q)) return
      const key = answerKey(q)
      if (key && usedAnswerKeys.has(key)) return
      addSelected(q)
    })
  }

  const allQuestions = selectedQuestions.filter(hasRenderableDiagnosticShape)

  if (allQuestions.length < 20) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-center px-4">
        <h1 className="text-2xl font-bold text-slate-800 mb-4">Not enough questions!</h1>
        <p className="text-slate-500 mb-8">We need at least 20 multiple-choice questions to run a diagnostic. Current count: {allQuestions.length}</p>
        {/* Same guest-safety reason as the "Exit Test" link below: /dashboard is
            auth-gated, so a logged-out visitor hitting this error state would be
            bounced to /login. Label follows the destination so it doesn't promise
            a dashboard the guest hasn't got. */}
        <Link href={user ? '/dashboard' : '/'} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition">
          {user ? 'Back to Dashboard' : 'Back to Home'}
        </Link>
      </div>
    )
  }

  // Shuffle for a fresh experience
  const shuffledQuestions = shuffleArray(allQuestions)

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
      <nav className="bg-white border-b border-slate-100 py-3 px-6 shrink-0">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          {/* This diagnostic is public, so a guest may well be taking it. Sending
              them to /dashboard on exit bounced them into /login (it's inside the
              auth-gated (app) group) — a login wall is the last thing to show
              someone who just chose to leave. Authenticated users still get the
              dashboard, which is the useful destination for them. */}
          <Link href={user ? '/dashboard' : '/'} className="flex items-center gap-2 text-slate-400 hover:text-slate-800 transition-colors font-bold text-sm">
            <ArrowLeft className="h-4 w-4" />
            Exit Test
          </Link>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-amber-500 rounded-lg flex items-center justify-center text-white font-bold">
              B
            </div>
            <span className="font-bold text-slate-800 text-lg">Baseline Assessment</span>
          </div>
          <div className="w-20"></div> {/* Spacer for symmetry */}
        </div>
      </nav>

      <main className="flex-1 overflow-hidden">
        <DiagnosticSession 
          questions={shuffledQuestions} 
          childId={child?.id || null} 
          userEmail={user?.email}
        />
      </main>
    </div>
  )
}
