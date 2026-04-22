import Link from 'next/link'
import { ArrowRight, Sparkles, Target, Zap, ShieldCheck, Star } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="bg-white min-h-screen">
      {/* Navigation */}
      <nav className="max-w-7xl mx-auto px-6 py-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-100">
            A
          </div>
          <span className="font-bold text-slate-900 text-xl tracking-tight">Ace11+</span>
        </div>
        <div className="hidden md:flex items-center gap-10">
          <a href="#features" className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors">Features</a>
          <a href="#curriculum" className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors">Curriculum</a>
          <Link href="/login" className="text-sm font-bold text-slate-900 hover:text-indigo-600 transition-colors">Log In</Link>
          <Link href="/signup" className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-100 transition-all">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-32 grid lg:grid-cols-2 gap-20 items-center">
        <div>
          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-full mb-8">
            <Sparkles className="h-4 w-4 text-indigo-600" />
            <span className="text-xs font-bold text-indigo-700 uppercase tracking-widest leading-none">AI-Powered Learning</span>
          </div>
          <h1 className="text-6xl sm:text-7xl font-black text-slate-900 leading-[1.1] mb-8 tracking-tight">
            The Smartest Way to <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Ace the 11+.</span>
          </h1>
          <p className="text-slate-500 text-xl leading-relaxed mb-10 max-w-lg">
            Personalized practice, instant AI-driven tutoring, and deep diagnostic analytics designed to build confidence and mastery.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link href="/signup" className="w-full sm:w-auto px-10 py-5 bg-slate-900 text-white rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-2xl shadow-slate-200">
              Start Free Today
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="#demo" className="w-full sm:w-auto px-10 py-5 bg-white border-2 border-slate-100 text-slate-600 rounded-2xl font-bold text-lg hover:bg-slate-50 transition-all">
              Watch Demo
            </Link>
          </div>
          <div className="mt-12 flex items-center gap-6">
            <div className="flex -space-x-3">
              {[1,2,3,4].map(i => (
                <div key={i} className="h-10 w-10 rounded-full border-2 border-white bg-slate-100 ring-2 ring-indigo-50" />
              ))}
            </div>
            <p className="text-sm font-bold text-slate-400">
              <span className="text-slate-900">1,000+</span> parents trust Ace11+
            </p>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-4 bg-gradient-to-tr from-indigo-200 to-violet-200 rounded-[3rem] blur-2xl opacity-20 animate-pulse" />
          <div className="relative bg-white p-10 rounded-[3rem] border border-slate-100 shadow-2xl shadow-indigo-100/50">
             <div className="space-y-6">
                <div className="flex items-center justify-between mb-8">
                   <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                         <Target className="h-5 w-5 text-indigo-600" />
                      </div>
                      <span className="font-bold text-slate-800">Topic Progress</span>
                   </div>
                   <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase">Up 12%</div>
                </div>
                <div className="space-y-4">
                   <div className="h-4 w-full bg-slate-50 rounded-full overflow-hidden">
                      <div className="h-full w-[85%] bg-indigo-500 rounded-full" />
                   </div>
                   <div className="h-4 w-full bg-slate-50 rounded-full overflow-hidden">
                      <div className="h-full w-[60%] bg-violet-500 rounded-full" />
                   </div>
                   <div className="h-4 w-full bg-slate-50 rounded-full overflow-hidden">
                      <div className="h-full w-[45%] bg-amber-500 rounded-full" />
                   </div>
                </div>
                <div className="pt-8 border-t border-slate-100 mt-8 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-slate-50 rounded-full" />
                      <div className="space-y-1">
                         <div className="h-3 w-20 bg-slate-100 rounded-full" />
                         <div className="h-2 w-12 bg-slate-50 rounded-full" />
                      </div>
                   </div>
                   <Zap className="h-6 w-6 text-indigo-600 fill-current" />
                </div>
             </div>
          </div>
          {/* Floating badge */}
          <div className="absolute -bottom-6 -left-6 bg-white p-5 rounded-2xl shadow-xl shadow-indigo-100 border border-indigo-50 max-w-[180px]">
             <div className="flex items-center gap-2 mb-2">
                <Star className="h-4 w-4 text-amber-500 fill-current" />
                <span className="text-xs font-black text-slate-900 tracking-tight">AI Explanations</span>
             </div>
             <p className="text-[10px] leading-relaxed text-slate-400 font-medium">Step-by-step guidance whenever you get stuck.</p>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="bg-slate-50 py-20 border-y border-slate-100 overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-6 text-center">
           <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em] mb-12">Built for UK Grammar & Private Schools</h3>
           <div className="flex flex-wrap justify-between items-center opacity-30 gap-8 grayscale">
              <span className="text-2xl font-black">GL ASSESSMENT</span>
              <span className="text-2xl font-black">SET TESTS</span>
              <span className="text-2xl font-black">ISEB CURRICULUM</span>
              <span className="text-2xl font-black">CEM EXAM</span>
           </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-32">
        <div className="text-center max-w-2xl mx-auto mb-20">
           <h2 className="text-4xl font-black text-slate-900 mb-6">Everything you need to succeed.</h2>
           <p className="text-slate-500 text-lg">A complete toolkit designed to eliminate exam anxiety and build deep subject knowledge.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
           <FeatureCard 
             icon={<Target className="h-6 w-6" />}
             title="Diagnostic Baseline"
             desc="Find exactly where you stand with our 20-question comprehensive initial assessment."
           />
           <FeatureCard 
             icon={<Brain className="h-6 w-6" />}
             title="AI Tutor Mode"
             desc="Get instant, child-friendly explanations for any question you find difficult."
           />
           <FeatureCard 
             icon={<BarChart3 className="h-6 w-6" />}
             title="Mastery Analytics"
             desc="Track progress per topic so you can focus on the areas that matter most."
           />
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-6 pb-40">
         <div className="bg-slate-900 rounded-[3rem] p-12 sm:p-20 text-center text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500 blur-[120px] rounded-full opacity-20 -mr-48 -mt-48" />
            <h2 className="text-4xl sm:text-5xl font-black mb-8 relative z-10 underline decoration-indigo-500 decoration-8 underline-offset-4">Give your child the edge.</h2>
            <p className="text-slate-400 text-xl max-w-xl mx-auto mb-12 relative z-10">Join thousands of students preparing for 11+ success with personalized AI guidance.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 relative z-10">
               <Link href="/signup" className="w-full sm:w-auto px-10 py-5 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-500/20">
                  Create Parent Account
               </Link>
               <span className="text-slate-500 font-bold uppercase text-xs tracking-widest">No Credit Card Required</span>
            </div>
         </div>
      </section>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-20 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-10">
         <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
               A
            </div>
            <span className="font-bold text-slate-900 tracking-tight">Ace11+</span>
         </div>
         <div className="flex gap-10">
            <a href="#" className="text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors">Privacy</a>
            <a href="#" className="text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors">Terms</a>
            <a href="#" className="text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors">Help</a>
         </div>
         <p className="text-xs font-bold text-slate-300">© 2025 AI-Powered Prep Ltd.</p>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
   return (
      <div className="p-10 rounded-[2.5rem] bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-xl hover:shadow-indigo-50 transition-all duration-300 group">
         <div className="h-14 w-14 bg-white rounded-2xl flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 transition-transform text-indigo-600">
            {icon}
         </div>
         <h4 className="text-2xl font-black text-slate-900 mb-4">{title}</h4>
         <p className="text-slate-500 leading-relaxed text-sm">{desc}</p>
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
