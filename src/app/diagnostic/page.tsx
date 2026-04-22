import { createClient } from '@/lib/supabase/server'
import { DiagnosticSession } from '@/components/DiagnosticSession'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

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

  // 3. Fetch up to 20 questions for the diagnostic test
  const { data: questions, error: questionsError } = await supabase
    .from('questions')
    .select('*')
    .limit(20)

  if (questionsError || !questions || questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-center px-4">
        <h1 className="text-2xl font-bold text-slate-800 mb-4">No questions found!</h1>
        <p className="text-slate-500 mb-8">Make sure to seed the database first.</p>
        <Link href="/dashboard" className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition">
          Back to Dashboard
        </Link>
      </div>
    )
  }

  // Shuffle for a fresh experience
  const shuffledQuestions = [...questions].sort(() => Math.random() - 0.5)

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-100 py-4 px-6 mb-8">
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

      <main className="max-w-5xl mx-auto pb-20">
        <DiagnosticSession questions={shuffledQuestions} childId={child.id} />
      </main>
    </div>
  )
}
