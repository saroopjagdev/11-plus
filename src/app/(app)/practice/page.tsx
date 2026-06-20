import { createClient } from '@/lib/supabase/server'
import { PracticeSession } from '@/components/PracticeSession'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { hasProAccess } from '@/lib/entitlements'

export default async function PracticePage() {
  const supabase = await createClient()

  // 1. Check if user is logged in
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/login')
  }

  const [{ data: profile }, { data: children }] = await Promise.all([
    supabase.from('profiles').select('subscription_status').eq('id', user.id).single(),
    supabase.from('children').select('id').eq('parent_id', user.id).limit(1),
  ])

  const childId = children?.[0]?.id
  const isPro = hasProAccess(profile)

  // 2. Fetch 10 random questions
  // In a real app, you might want to fetch based on difficulty or topic.
  // For now, we'll fetch 10 random questions from the database.
  const { data: questions, error: questionsError } = await supabase
    .from('questions')
    .select('*')
    .limit(10)

  if (questionsError || !questions || questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-center px-4">
        <h1 className="text-2xl font-bold text-slate-800 mb-4">No questions found!</h1>
        <p className="text-slate-500 mb-8">
          Make sure to run the seed route first: 
          <code className="bg-slate-200 px-2 py-1 rounded ml-1">/api/admin/seed</code>
        </p>
        <a 
          href="/dashboard" 
          className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition"
        >
          Back to Dashboard
        </a>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Simple Practice Header */}
      <nav className="bg-white border-b border-slate-100 py-4 px-6 mb-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
              A
            </div>
            <span className="font-bold text-slate-800 text-lg">Ace11+ Practice</span>
          </div>
          <Link
            href="/dashboard"
            className="text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            Quit Session
          </Link>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto pb-20">
        <PracticeSession questions={questions} childId={childId} isPro={isPro} />
      </main>
    </div>
  )
}
