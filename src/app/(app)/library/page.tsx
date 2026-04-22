import React from 'react'
import { Book, Search, FileText, ChevronRight, Zap, Target, Brain } from 'lucide-react'
import Link from 'next/link'

export default function LibraryPage() {
  const categories = [
    {
      title: 'Mathematics',
      icon: <Zap className="h-6 w-6 text-indigo-600" />,
      color: 'bg-indigo-50',
      topics: [
        { name: 'Fractions Survival Guide', level: 'Core', readTime: '5 min' },
        { name: 'Decimal mastery', level: 'Advanced', readTime: '8 min' },
        { name: 'Geometry Formulas', level: 'Core', readTime: '3 min' },
        { name: 'Long Division Tricks', level: 'Intermediate', readTime: '6 min' },
      ]
    },
    {
      title: 'English & Literacy',
      icon: <Target className="h-6 w-6 text-violet-600" />,
      color: 'bg-violet-50',
      topics: [
        { name: 'The 11+ High-Frequency Vocab', level: 'Core', readTime: '10 min' },
        { name: 'Punctuation Perfection', level: 'Core', readTime: '5 min' },
        { name: 'Cloze Test Strategies', level: 'Advanced', readTime: '12 min' },
        { name: 'Inference & Deduction', level: 'Advanced', readTime: '9 min' },
      ]
    },
    {
      title: 'Reasoning Skills',
      icon: <Brain className="h-6 w-6 text-amber-600" />,
      color: 'bg-amber-50',
      topics: [
        { name: 'Verbal Logic Patterns', level: 'Advanced', readTime: '7 min' },
        { name: 'Letter Sequence Secrets', level: 'Core', readTime: '4 min' },
        { name: 'Non-Verbal Rotations', level: 'Intermediate', readTime: '8 min' },
      ]
    }
  ]

  return (
    <div className="p-8 lg:p-12 max-w-6xl mx-auto">
      <header className="mb-12">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Topic Library</h1>
        <p className="text-slate-500">Master the theory behind the questions with our 11+ Study Guides.</p>
      </header>

      {/* Search Bar */}
      <div className="relative mb-16">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
        <input 
          type="text" 
          placeholder="Search for a topic (e.g. 'Fractions')" 
          className="w-full bg-white border border-slate-100 rounded-[2rem] py-6 pl-14 pr-8 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all font-medium text-lg shadow-sm"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {categories.map((category, idx) => (
          <div key={idx} className="space-y-6">
            <div className="flex items-center gap-3 mb-8">
              <div className={`${category.color} p-3 rounded-2xl`}>
                {category.icon}
              </div>
              <h2 className="text-2xl font-black text-slate-900">{category.title}</h2>
            </div>

            <div className="space-y-4">
              {category.topics.map((topic, i) => (
                <Link 
                  key={i} 
                  href={`/library/${topic.name.toLowerCase().replace(/ /g, '-')}`}
                  className="block p-6 bg-white border border-slate-100 rounded-[2rem] hover:shadow-xl hover:shadow-indigo-50 transition-all group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-full">
                      {topic.level}
                    </span>
                    <span className="text-slate-300 text-xs font-bold">{topic.readTime} read</span>
                  </div>
                  <h4 className="font-bold text-slate-800 text-lg group-hover:text-indigo-600 transition-colors mb-4">{topic.name}</h4>
                  <div className="flex items-center justify-between text-indigo-600 font-bold text-sm">
                    <span className="flex items-center gap-2">
                       <FileText className="h-4 w-4" />
                       View Notes
                    </span>
                    <ChevronRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Featured Guide placeholder */}
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
