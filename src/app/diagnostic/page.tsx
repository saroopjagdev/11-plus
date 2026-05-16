import { createClient } from '@/lib/supabase/server'
import { DiagnosticSession } from '@/components/DiagnosticSession'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { CURRICULUM_LADDER } from '@/lib/constants/curriculum'

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
  // We need 4 Easy, 6 Medium, 10 Hard covering all 17 topics.
  
  // Shuffle topics to ensure different questions each time
  const topics = [...CURRICULUM_LADDER].sort(() => Math.random() - 0.5)
  const easyTopics = topics.slice(0, 4).map(t => t.topic)
  const mediumTopics = topics.slice(4, 10).map(t => t.topic)
  const hardTopics = topics.slice(10, 17).map(t => t.topic)

  // Fetch pools for each difficulty/topic group
  const [easyPool, mediumPool, hardPool, extraHardPool] = await Promise.all([
    supabase.from('questions').select('*').in('topic', easyTopics).eq('difficulty', 'Easy'),
    supabase.from('questions').select('*').in('topic', mediumTopics).eq('difficulty', 'Medium'),
    supabase.from('questions').select('*').in('topic', hardTopics).eq('difficulty', 'Hard'),
    supabase.from('questions').select('*').eq('difficulty', 'Hard').limit(20) // Extra pool for variety and filling gaps
  ])

  const selectedQuestions: any[] = []
  const usedIds = new Set<string>()

  // 1. Pick one Easy per easyTopic
  easyTopics.forEach(topic => {
    const q = easyPool.data?.find(q => q.topic === topic && !usedIds.has(q.id))
    if (q) {
      selectedQuestions.push(q)
      usedIds.add(q.id)
    }
  })

  // 2. Pick one Medium per mediumTopic
  mediumTopics.forEach(topic => {
    const q = mediumPool.data?.find(q => q.topic === topic && !usedIds.has(q.id))
    if (q) {
      selectedQuestions.push(q)
      usedIds.add(q.id)
    }
  })

  // 3. Pick one Hard per hardTopic
  hardTopics.forEach(topic => {
    const q = hardPool.data?.find(q => q.topic === topic && !usedIds.has(q.id))
    if (q) {
      selectedQuestions.push(q)
      usedIds.add(q.id)
    }
  })

  // 4. Fill to 20 questions with Hard questions (prioritize topic variety)
  const remainingHard = (extraHardPool.data || []).filter(q => !usedIds.has(q.id))
  while (selectedQuestions.length < 20 && remainingHard.length > 0) {
    const q = remainingHard.shift()
    if (q) {
      selectedQuestions.push(q)
      usedIds.add(q.id)
    }
  }

  // Final fallback: if still not 20, just get any random ones (shouldn't happen with decent bank)
  if (selectedQuestions.length < 20) {
    const { data: fallback } = await supabase.from('questions').select('*').limit(20)
    fallback?.forEach(q => {
      if (selectedQuestions.length < 20 && !usedIds.has(q.id)) {
        selectedQuestions.push(q)
        usedIds.add(q.id)
      }
    })
  }

  const allQuestions = selectedQuestions

  if (allQuestions.length < 10) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-center px-4">
        <h1 className="text-2xl font-bold text-slate-800 mb-4">Not enough questions!</h1>
        <p className="text-slate-500 mb-8">We need at least 10 questions to run a diagnostic. Current count: {allQuestions.length}</p>
        <Link href="/dashboard" className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition">
          Back to Dashboard
        </Link>
      </div>
    )
  }

  // Shuffle for a fresh experience
  const shuffledQuestions = [...allQuestions].sort(() => Math.random() - 0.5)

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
      <nav className="bg-white border-b border-slate-100 py-3 px-6 shrink-0">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-slate-800 transition-colors font-bold text-sm">
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
