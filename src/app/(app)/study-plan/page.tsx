import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Calendar, Target, CheckCircle2, ChevronRight, Zap, Award, Clock } from 'lucide-react'
import Link from 'next/link'
import { getStudentRecommendations } from '@/lib/recommendations'

export default async function StudyPlanPage() {
  const supabase = await createClient()

  // 1. Auth Check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 2. Fetch Child
  const { data: children } = await supabase.from('children').select('*').eq('parent_id', user.id)
  if (!children || children.length === 0) redirect('/dashboard')
  
  const child = children[0]
  const recommendations = await getStudentRecommendations(supabase, child.id)

  const days = [
    { name: 'Monday', focus: 'Mathematics', task: 'Fractions & Ratios', href: '/practice/topic/Fractions' },
    { name: 'Tuesday', focus: 'English', task: 'Inference Skills', href: '/practice/topic/Inference' },
    { name: 'Wednesday', focus: 'Reasoning', task: 'Logic Patterns', href: '/practice/topic/Logic' },
    { name: 'Thursday', focus: 'Mathematics', task: 'Geometry Basics', href: '/practice/topic/Geometry' },
    { name: 'Friday', focus: 'Mixed', task: 'Full Mock Exam', href: '/practice/mock/Maths' },
    { name: 'Saturday', focus: 'Review', task: 'Weak Point Focus', href: '/practice/drill/Mixed' },
    { name: 'Sunday', focus: 'Rest', task: 'Mindset & Prep', href: '/library' },
  ]

  const todayIndex = new Date().getDay() - 1 // 0-indexed Mon-Sun
  const currentDay = days[todayIndex >= 0 ? todayIndex : 6]

  return (
    <div className="p-8 lg:p-12 max-w-6xl mx-auto">
      <header className="mb-12">
        <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full mb-4 border border-emerald-100">
           <Calendar className="h-4 w-4" />
           <span className="text-[10px] font-black uppercase tracking-widest">Adaptive Study Plan</span>
        </div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">The Path to Success</h1>
        <p className="text-slate-500">A personalized 11+ roadmap for {child.name}. Updated live based on performance.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Today's Mission */}
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-indigo-200">
             <div className="relative z-10">
                <div className="flex items-center gap-2 text-indigo-400 font-black text-[10px] uppercase tracking-[0.2em] mb-8">
                   <Zap className="h-4 w-4 fill-current" />
                   Today&apos;s Mission
                </div>
                
                <h2 className="text-5xl font-black mb-6 italic tracking-tight">{currentDay.task}</h2>
                <p className="text-slate-400 text-lg mb-10 max-w-md">Our AI analysis suggests focusing on <strong>{currentDay.task}</strong> today to maximize score growth.</p>
                
                <div className="flex flex-wrap gap-4">
                   <Link 
                     href={currentDay.href}
                     className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/20"
                   >
                     Start Practice
                     <ChevronRight className="h-5 w-5" />
                   </Link>
                   <Link 
                     href="/library"
                     className="px-8 py-4 bg-white/10 hover:bg-white/20 rounded-2xl font-bold flex items-center gap-2 transition-all backdrop-blur-md"
                   >
                     View Notes
                   </Link>
                </div>
             </div>
             {/* Decorative Background */}
             <div className="absolute -right-20 -bottom-20 h-80 w-80 bg-indigo-500/20 rounded-full blur-[100px]" />
             <div className="absolute top-10 right-10 opacity-10">
                <Target className="h-40 w-40" />
             </div>
          </section>

          {/* Weekly Grid */}
          <section className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm transition-all hover:shadow-xl hover:shadow-indigo-50/50">
             <h3 className="text-xl font-bold text-slate-900 mb-8">Weekly Schedule</h3>
             <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                {days.map((day, i) => (
                  <Link 
                    key={day.name} 
                    href={day.href}
                    className={`p-4 rounded-2xl border transition-all hover:scale-105 active:scale-95 group ${i === todayIndex ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-500/10' : 'bg-slate-50 border-slate-100'}`}
                  >
                    <p className={`text-[10px] font-black uppercase mb-3 ${i === todayIndex ? 'text-indigo-600' : 'text-slate-400'}`}>{day.name.slice(0, 3)}</p>
                    <p className={`text-sm font-bold truncate ${i === todayIndex ? 'text-slate-900' : 'text-slate-500'}`}>{day.focus}</p>
                    {i < todayIndex ? (
                       <div className="mt-4 text-emerald-500">
                          <CheckCircle2 className="h-5 w-5" />
                       </div>
                    ) : (
                       <div className="mt-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
                          <ChevronRight className="h-4 w-4" />
                       </div>
                    )}
                  </Link>
                ))}
             </div>
          </section>
        </div>

        {/* Right Column: Milestones & Goals */}
        <div className="space-y-8">
           <section className="bg-indigo-50 rounded-[2.5rem] p-8 border border-indigo-100">
              <h3 className="text-xl font-bold text-indigo-900 mb-6 flex items-center gap-2">
                 <Award className="h-6 w-6" />
                 Skill Milestones
              </h3>
              <div className="space-y-6">
                <Milestone 
                   label="Fraction Mastery" 
                   progress={recommendations.find(r => r.topic === 'Fractions')?.accuracy || 45} 
                   target={80}
                />
                <Milestone 
                   label="Vocabulary Strength" 
                   progress={65} 
                   target={90}
                />
                <Milestone 
                   label="Mock Consistency" 
                   progress={30} 
                   target={75}
                />
              </div>
           </section>

           <section className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm border-dashed border-2">
              <div className="text-center py-6">
                 <div className="h-14 w-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Clock className="h-6 w-6 text-slate-300" />
                 </div>
                 <h4 className="font-bold text-slate-800 mb-1">Set a Custom Goal</h4>
                 <p className="text-xs text-slate-400 max-w-[180px] mx-auto balance italic underline decoration-slate-200">Coming soon for Pro members</p>
              </div>
           </section>
        </div>
      </div>
    </div>
  )
}

function Milestone({ label, progress, target }: { label: string, progress: number, target: number }) {
  const percent = (progress / target) * 100
  return (
    <div className="space-y-2">
       <div className="flex justify-between text-xs font-bold uppercase tracking-tight">
          <span className="text-indigo-900">{label}</span>
          <span className="text-indigo-400">{progress}% / {target}%</span>
       </div>
       <div className="h-2 w-full bg-white rounded-full overflow-hidden border border-indigo-100">
          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(percent, 100)}%` }} />
       </div>
    </div>
  )
}
