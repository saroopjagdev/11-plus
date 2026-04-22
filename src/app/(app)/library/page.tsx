import { createClient } from '@/lib/supabase/server'
import { Book, Zap, Target, Brain } from 'lucide-react'
import { LibrarySearch } from '@/components/LibrarySearch'

export default async function LibraryPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: children } = await supabase
    .from('children')
    .select('target_exams')
    .eq('parent_id', user?.id)
    .limit(1)

  const targetExams = children?.[0]?.target_exams || []

  const categories = [
    {
      title: 'Mathematics',
      icon: <Zap className="h-6 w-6 text-indigo-600" />,
      color: 'bg-indigo-50',
      topics: [
        { name: 'Fractions Survival Guide', level: 'Core', readTime: '5 min', boards: ['GL', 'CEM', 'CSSE'] },
        { name: 'Decimal mastery', level: 'Advanced', readTime: '8 min', boards: ['GL', 'CEM', 'CSSE'] },
        { name: 'Geometry Formulas', level: 'Core', readTime: '3 min', boards: ['GL', 'CEM', 'CSSE'] },
        { name: 'Long Division Tricks', level: 'Intermediate', readTime: '6 min', boards: ['GL', 'CEM'] },
        { name: 'Algebra Basics', level: 'Intermediate', readTime: '7 min', boards: ['GL', 'CSSE'] },
      ]
    },
    {
      title: 'English & Literacy',
      icon: <Target className="h-6 w-6 text-violet-600" />,
      color: 'bg-violet-50',
      topics: [
        { name: 'The 11+ High-Frequency Vocab', level: 'Core', readTime: '10 min', boards: ['GL', 'CEM', 'CSSE'] },
        { name: 'Punctuation Perfection', level: 'Core', readTime: '5 min', boards: ['GL', 'CEM', 'CSSE'] },
        { name: 'Cloze Test Strategies', level: 'Advanced', readTime: '12 min', boards: ['CEM'] },
        { name: 'Inference & Deduction', level: 'Advanced', readTime: '9 min', boards: ['CEM', 'CSSE'] },
        { name: 'Creative Writing Structure', level: 'Advanced', readTime: '15 min', boards: ['CSSE'] },
      ]
    },
    {
      title: 'Reasoning Skills',
      icon: <Brain className="h-6 w-6 text-amber-600" />,
      color: 'bg-amber-50',
      topics: [
        { name: 'Verbal Logic Patterns', level: 'Advanced', readTime: '7 min', boards: ['GL', 'CEM'] },
        { name: 'Letter Sequence Secrets', level: 'Core', readTime: '4 min', boards: ['GL'] },
        { name: 'Non-Verbal Rotations', level: 'Intermediate', readTime: '8 min', boards: ['GL'] },
        { name: 'Code Breaking', level: 'Intermediate', readTime: '6 min', boards: ['GL', 'CEM'] },
      ]
    }
  ]

  return (
    <div className="p-8 lg:p-12 max-w-6xl mx-auto">
      <header className="mb-12">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Topic Library</h1>
        <p className="text-slate-500">Master the theory behind the questions with our 11+ Study Guides.</p>
      </header>

      <LibrarySearch categories={categories} targetExams={targetExams} />

      {/* Featured Guide */}
      <section className="mt-20 bg-slate-900 rounded-[3rem] p-12 text-white relative overflow-hidden">
         <div className="max-w-xl relative z-10">
            <h3 className="text-3xl font-black mb-4">Exam Success Handbook</h3>
            <p className="text-slate-400 mb-8 leading-relaxed">Our comprehensive guide on exam day psychology, time management, and test-taking strategies. A must-read for both parents and students.</p>
            <button className="px-8 py-4 bg-indigo-600 rounded-2xl font-bold hover:bg-indigo-500 transition-all flex items-center gap-2">
               Download PDF Guide
               <Zap className="h-4 w-4 fill-current" />
            </button>
         </div>
         <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500 opacity-20 blur-[100px] -mr-48 -mt-48" />
         <Book className="absolute -right-10 -bottom-10 h-64 w-64 text-white/5 opacity-40 rotate-12" />
      </section>
    </div>
  )
}
