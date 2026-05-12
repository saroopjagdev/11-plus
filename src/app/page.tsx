import Link from 'next/link'
import { ArrowRight, Sparkles, Target, Zap, ShieldCheck, Star, Check, HelpCircle, BookOpen, Clock, Trophy } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="bg-white min-h-screen font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Ace 11+"
              className="h-12 w-12 object-contain rounded-xl"
            />
            <span className="font-bold text-slate-900 text-xl tracking-tight">Ace 11+</span>
          </div>
          <div className="hidden md:flex items-center gap-10">
            <a href="#features" className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors">Features</a>
            <a href="#curriculum" className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors">Curriculum</a>
            <a href="#pricing" className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors">Pricing</a>
            <Link href="/login" className="text-sm font-bold text-slate-900 hover:text-indigo-600 transition-colors">Log In</Link>
            <Link href="/signup" className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 hover:shadow-lg transition-all">
              Join Now
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-40 pb-32 grid lg:grid-cols-2 gap-20 items-center">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-full mb-8">
            <Sparkles className="h-4 w-4 text-indigo-600" />
            <span className="text-xs font-bold text-indigo-700 uppercase tracking-widest leading-none">The Future of 11+ Preparation</span>
          </div>
          <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black text-slate-900 leading-[0.95] mb-8 tracking-tighter">
            Ace the <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">11 Plus.</span>
          </h1>
          <p className="text-slate-500 text-xl leading-relaxed mb-10 max-w-lg font-medium">
            Personalized practice, instant AI-driven tutoring, and deep diagnostic analytics designed to build confidence and mastery.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link href="/signup" className="w-full sm:w-auto px-10 py-5 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-2xl shadow-indigo-200">
              Start Free Trial
              <ArrowRight className="h-5 w-5" />
            </Link>
            <a href="#curriculum" className="w-full sm:w-auto px-10 py-5 bg-white text-slate-900 border-2 border-slate-100 rounded-2xl font-bold text-lg hover:border-indigo-200 transition-all text-center">
              View Curriculum
            </a>
          </div>
          <div className="mt-12 flex items-center gap-4">
            <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
              Live Diagnostic Engine Active
            </p>
          </div>
        </div>

        <div className="relative perspective-1000">
          <div className="absolute -inset-10 bg-gradient-to-tr from-indigo-200 to-violet-200 rounded-[4rem] blur-3xl opacity-30 animate-pulse" />
          <div className="relative bg-white p-2 rounded-[3rem] border border-slate-200 shadow-[0_32px_64px_-16px_rgba(79,70,229,0.2)] overflow-hidden">
            <div className="bg-slate-50 p-8 rounded-[2.5rem]">
              <div className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <Trophy className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Daily Progress</div>
                    <div className="text-xl font-black text-slate-900">Level 14</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="h-2 w-12 bg-indigo-500 rounded-full" />
                  <div className="h-2 w-8 bg-slate-200 rounded-full" />
                </div>
              </div>

              <div className="grid gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-bold text-slate-800 text-sm">Arithmetic Mastery</span>
                    <span className="text-emerald-500 font-black text-sm">85%</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-50 rounded-full overflow-hidden">
                    <div className="h-full w-[85%] bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full" />
                  </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 opacity-60">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-bold text-slate-800 text-sm">Vocabulary Skills</span>
                    <span className="text-indigo-500 font-black text-sm">42%</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-50 rounded-full overflow-hidden">
                    <div className="h-full w-[42%] bg-gradient-to-r from-indigo-400 to-indigo-500 rounded-full" />
                  </div>
                </div>
              </div>

              <div className="mt-12 p-6 bg-indigo-900 rounded-3xl text-white relative overflow-hidden">
                <Zap className="absolute top-4 right-4 h-8 w-8 text-indigo-400/30" />
                <div className="relative z-10">
                  <div className="text-xs font-bold text-indigo-300 uppercase mb-2">Next Mission</div>
                  <div className="text-lg font-black mb-4 leading-tight">Master Percentages to reach Level 15</div>
                  <button className="w-full py-3 bg-white text-indigo-900 rounded-xl font-bold text-sm shadow-xl">Resume Practice</button>
                </div>
              </div>
            </div>
          </div>

          {/* Floating badge */}
          <div className="absolute -bottom-6 -right-6 lg:-bottom-10 lg:-right-10 bg-white p-6 rounded-3xl shadow-[0_20px_50px_rgba(79,70,229,0.3)] border border-indigo-50 max-w-[220px] animate-bounce-slow z-20">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-8 w-8 bg-amber-100 rounded-full flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-amber-600 fill-current" />
              </div>
              <span className="text-sm font-black text-slate-900 tracking-tight">AI Explanation</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-600 font-semibold italic">"Think of fractions like slices of a pizza..."</p>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="bg-slate-50 py-24 border-y border-slate-100 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.4em] mb-16">Trusted by parents for</h3>
          <div className="flex flex-wrap justify-center items-center gap-x-20 gap-y-12 opacity-80">
            <span className="text-3xl font-black tracking-tighter text-slate-700">GL ASSESSMENT</span>
            <span className="text-3xl font-black tracking-tighter text-slate-700">CEM EXAMS</span>
            <span className="text-3xl font-black tracking-tighter text-slate-700">ISEB BOARD</span>
            <span className="text-3xl font-black tracking-tighter text-slate-700">PRIVATE SCHOOLS</span>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-40">
        <div className="text-center max-w-3xl mx-auto mb-24">
          <h2 className="text-5xl font-black text-slate-900 mb-8 tracking-tight">The ultimate toolkit for success.</h2>
          <p className="text-slate-500 text-xl font-medium leading-relaxed">We've automated the hard part of 11+ prep so you can focus on building confidence and mastery.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-10">
          <FeatureCard
            icon={<Target className="h-8 w-8" />}
            title="Diagnostic First"
            desc="Find exactly where you stand with our 20-question comprehensive initial assessment. No more guessing."
            color="indigo"
          />
          <FeatureCard
            icon={<Brain className="h-8 w-8" />}
            title="Smart AI Tutor"
            desc="Get instant, friendly explanations tailored to a 10-year-old's level. It's like having a tutor available 24/7."
            color="violet"
          />
          <FeatureCard
            icon={<ShieldCheck className="h-8 w-8" />}
            title="Exam Standard"
            desc="Our question bank is strictly aligned with GL, CEM, and top Private School entrance exams."
            color="emerald"
          />
        </div>
      </section>

      {/* Curriculum Section */}
      <section id="curriculum" className="bg-slate-900 py-40 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,rgba(79,70,229,0.15),transparent)] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row gap-20 items-center">
            <div className="lg:w-1/2">
              <h2 className="text-5xl font-black text-white mb-8 leading-tight tracking-tight">
                A curriculum that <br />
                <span className="text-indigo-400">covers every angle.</span>
              </h2>
              <p className="text-slate-400 text-xl mb-12 leading-relaxed">
                Our AI builds a custom learning ladder for every student, ensuring they master the basics before moving to the high-difficulty challenges.
              </p>

              <div className="grid gap-4">
                <CurriculumItem title="Mathematics Mastery" topics={['Arithmetic', 'Fractions', 'Algebra', 'Geometry']} />
                <CurriculumItem title="English Excellence" topics={['Comprehension', 'Grammar', 'Vocabulary', 'Spelling']} />
                <CurriculumItem title="Verbal Reasoning" topics={['Coding', 'Synonyms', 'Antonyms', 'Number Series']} />
              </div>
            </div>

            <div className="lg:w-1/2 grid grid-cols-2 gap-6 relative">
              <div className="absolute inset-0 bg-indigo-500/20 blur-[120px] rounded-full" />
              <div className="space-y-6 pt-12">
                <CurriculumCard title="Fractions" level="Medium" marks="30" progress={85} />
                <CurriculumCard title="Synonyms" level="Hard" marks="15" progress={20} />
              </div>
              <div className="space-y-6">
                <CurriculumCard title="Arithmetic" level="Easy" marks="50" progress={100} />
                <CurriculumCard title="Algebra" level="Medium" marks="25" progress={65} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="max-w-7xl mx-auto px-6 py-40">
        <div className="text-center max-w-2xl mx-auto mb-20">
          <h2 className="text-5xl font-black text-slate-900 mb-6 tracking-tight">Simple, transparent pricing.</h2>
          <p className="text-slate-500 text-lg font-medium">Give your child the complete Ace 11+ advantage.</p>
        </div>

        <div className="max-w-lg mx-auto">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-[3rem] blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
            <div className="relative bg-white rounded-[3rem] p-10 border border-slate-100 shadow-2xl">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-3xl font-black text-slate-900 mb-2">Ace 11+ Pro</h3>
                  <p className="text-slate-500 font-medium">The complete preparation toolkit</p>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-black text-slate-900">£19.99</div>
                  <div className="text-slate-400 font-bold text-xs uppercase tracking-widest">per month</div>
                </div>
              </div>

              <div className="space-y-4 mb-10">
                <PricingFeature text="Full 2,000+ Question Bank" />
                <PricingFeature text="Unlimited AI Explanations" />
                <PricingFeature text="Parent Insight Dashboard" />
                <PricingFeature text="Detailed Diagnostic Exams" />
                <PricingFeature text="Study Guides & Cheat Sheets" />
                <PricingFeature text="Priority Support" />
              </div>

              <Link href="/signup" className="block w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-lg text-center hover:bg-slate-800 transition-all shadow-xl shadow-slate-200">
                Start Your 7-Day Free Trial
              </Link>
              <p className="text-center text-slate-400 text-[10px] font-bold mt-4 uppercase tracking-widest leading-relaxed">
                Card required for verification. <br />
                No charge until day 7. Cancel anytime.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-slate-50 py-40">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Common Questions</h2>
            <p className="text-slate-500 font-medium">Everything you need to know about Ace 11+.</p>
          </div>

          <div className="space-y-6">
            <FAQItem
              question="Is this suitable for both GL and CEM boards?"
              answer="Absolutely. Our question bank is dynamically updated to cover the specific logic and formatting of both GL Assessment and CEM, as well as common Private School entrance exams."
            />
            <FAQItem
              question="How does the AI tutoring work?"
              answer="Whenever a student gets a question wrong or feels stuck, they can click 'Explain'. Our AI instantly analyzes the specific question and provides a child-friendly, step-by-step breakdown of how to reach the answer."
            />
            <FAQItem
              question="Can I track my child's progress?"
              answer="Yes! As a parent, you have a dedicated dashboard that shows exactly which topics your child is mastering and which ones need more focus. You'll also receive weekly summaries."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-20 flex flex-col sm:flex-row justify-between items-center gap-10">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-indigo-100">
            A
          </div>
          <span className="font-bold text-slate-900 tracking-tight">Ace 11+</span>
        </div>
        <div className="flex gap-10">
          <Link href="/privacy" className="text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors">Privacy</Link>
          <Link href="/terms" className="text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors">Terms</Link>
          <a href="mailto:support@ace11plus.co.uk" className="text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors">Contact</a>
        </div>
        <p className="text-xs font-bold text-slate-300">© 2025 Ace 11+ Intelligence. All rights reserved.</p>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, desc, color }: { icon: React.ReactNode, title: string, desc: string, color: string }) {
  const colorMap: any = {
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    violet: 'bg-violet-50 text-violet-600 border-violet-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100'
  }
  return (
    <div className="p-10 rounded-[3rem] bg-white border border-slate-100 hover:shadow-2xl hover:shadow-indigo-100/50 transition-all duration-500 group">
      <div className={`h-16 w-16 ${colorMap[color]} rounded-2xl flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <h4 className="text-2xl font-black text-slate-900 mb-4">{title}</h4>
      <p className="text-slate-500 leading-relaxed font-medium text-sm">{desc}</p>
    </div>
  )
}

function CurriculumItem({ title, topics }: { title: string, topics: string[] }) {
  return (
    <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-sm">
      <div className="flex items-center gap-4 mb-4">
        <div className="h-10 w-10 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400">
          <BookOpen className="h-5 w-5" />
        </div>
        <h5 className="font-black text-white text-lg tracking-tight">{title}</h5>
      </div>
      <div className="flex flex-wrap gap-2">
        {topics.map(t => (
          <span key={t} className="px-3 py-1 bg-white/5 text-slate-400 rounded-full text-xs font-bold uppercase tracking-wider">{t}</span>
        ))}
      </div>
    </div>
  )
}

function CurriculumCard({ title, level, marks, progress }: { title: string, level: string, marks: string, progress: number }) {
  return (
    <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100">
      <div className="flex items-center justify-between mb-6">
        <span className="font-black text-slate-900">{title}</span>
        <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">{level}</span>
      </div>
      <div className="flex items-center gap-4 mb-2">
        <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${progress}%` }} />
        </div>
        <span className="text-[10px] font-black text-slate-400 uppercase">{progress}%</span>
      </div>
      <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{marks} Questions</div>
    </div>
  )
}

function PricingFeature({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-5 w-5 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
        <Check className="h-3 w-3" />
      </div>
      <span className="text-slate-600 font-medium text-sm">{text}</span>
    </div>
  )
}

function FAQItem({ question, answer }: { question: string, answer: string }) {
  return (
    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
      <div className="flex items-start gap-4">
        <HelpCircle className="h-6 w-6 text-indigo-500 shrink-0 group-hover:rotate-12 transition-transform" />
        <div>
          <h5 className="font-black text-slate-900 text-lg mb-3">{question}</h5>
          <p className="text-slate-500 leading-relaxed font-medium">{answer}</p>
        </div>
      </div>
    </div>
  )
}

function BarChart3({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )
}

function Brain({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  )
}
