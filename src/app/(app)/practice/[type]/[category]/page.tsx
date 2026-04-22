import { createClient } from '@/lib/supabase/server'
import { PracticeSession } from '@/components/PracticeSession'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Lock } from 'lucide-react'

interface PageProps {
  params: Promise<{
    type: string
    category: string
  }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function PracticeSessionPage({ params, searchParams }: PageProps) {
  const { type, category } = await params
  const sParams = await searchParams
  const supabase = await createClient()

  // 1. Auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 2. Pro check for Mocks
  const { data: profile } = await supabase.from('profiles').select('subscription_status').eq('id', user.id).single()
  const isPro = profile?.subscription_status === 'pro'

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
           <p className="text-slate-500 mb-8">Timed, 40-question mock exams are available for our premium members. Boost your child's exam stamina today!</p>
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

  // 3. Fetch Questions based on Type
  let query = supabase.from('questions').select('*')
  let limit = 10

  const decodedCategory = decodeURIComponent(category)

  if (type === 'topic') {
    query = query.eq('topic', decodedCategory)
    limit = 10
  } else if (type === 'drill') {
    query = query.eq('subject', decodedCategory)
    limit = 15
  } else if (type === 'mock') {
    query = query.eq('subject', decodedCategory)
    limit = 40
  }

  // Handle difficulty filter if present in URL
  const difficulty = sParams.difficulty
  if (difficulty && typeof difficulty === 'string' && difficulty !== 'Mixed') {
    query = query.eq('difficulty', difficulty)
  }

  const { data: questions, error } = await query.limit(limit)

  if (error || !questions || questions.length === 0) {
    redirect('/dashboard?error=no_questions')
  }

  // 4. Shuffle (client-side shuffle is fine for 10-40 questions)
  const shuffled = [...questions].sort(() => Math.random() - 0.5)

  return (
    <div className="h-[100dvh] bg-slate-50 overflow-hidden">
      <PracticeSession 
        questions={shuffled} 
        timeLimit={type === 'mock' ? 20 : undefined} 
        childId={childId}
      />
    </div>
  )
}
