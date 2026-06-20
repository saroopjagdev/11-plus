import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Sparkles, Target, ShieldCheck, Check, HelpCircle, BookOpen, Clock } from 'lucide-react'
import { OnboardingPlanner } from '@/components/OnboardingPlanner'

const featuredGuides = [
  {
    href: '/guides/kent-test-11-plus-guide',
    title: 'Kent Test guide',
    description: 'A practical starting point for one of the biggest selective routes in England.',
  },
  {
    href: '/guides/bucks-11-plus-guide',
    title: 'Bucks 11+ guide',
    description: 'Useful if you are preparing for a GL-style mixed profile with verbal, non-verbal and maths demands.',
  },
  {
    href: '/guides/year-5-11-plus-preparation-guide',
    title: 'Year 5 preparation guide',
    description: 'A calm plan for parents who need to know what matters most this year.',
  },
  {
    href: '/guides/11-plus-vocabulary-guide',
    title: '11+ vocabulary guide',
    description: 'A strong next read when word knowledge is starting to limit scores.',
  },
]

export default function LandingPage() {
  return (
    <div className="bg-white min-h-screen font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Ace 11+"
              width={48}
              height={48}
              className="h-12 w-12 object-contain rounded-xl"
            />
            <span className="font-bold text-slate-900 text-xl tracking-tight">Ace 11+</span>
          </div>
          <div className="hidden lg:flex items-center bg-indigo-50 border border-indigo-100 px-4 py-1.5 rounded-full">
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Free Baseline Assessment Available</span>
            <Link href="/diagnostic" className="ml-3 text-[10px] font-black text-indigo-700 underline underline-offset-2">Start Now</Link>
          </div>

          <div className="hidden md:flex items-center gap-10">
            <a href="#features" className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors">Features</a>
            <a href="#curriculum" className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors">Curriculum</a>
            <a href="#pricing" className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors">Pricing</a>
            <Link href="/guides" className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors">Guides</Link>
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
            <span className="text-xs font-bold text-indigo-700 uppercase tracking-widest leading-none">Personalized 11+ Preparation</span>
          </div>
          <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black text-slate-900 leading-[0.95] mb-8 tracking-tighter">
            Ace the <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">11 Plus.</span>
          </h1>
          <p className="text-slate-500 text-xl leading-relaxed mb-10 max-w-lg font-medium">
            Adaptive practice, smart step-by-step tutoring, and deep diagnostic analytics designed to build confidence and mastery for Year 4 and Year 5 students.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link href="/signup" className="w-full sm:w-auto px-10 py-5 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-2xl shadow-indigo-200">
              Start Free Trial
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="/diagnostic" className="w-full sm:w-auto px-10 py-5 bg-white text-slate-900 border-2 border-slate-100 rounded-2xl font-bold text-lg hover:border-indigo-200 transition-all text-center flex items-center justify-center gap-2">
              Take Free Diagnostic
              <Target className="h-5 w-5 text-indigo-600" />
            </Link>
          </div>
          <div className="mt-12 flex items-center gap-4">
            <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
              Live Diagnostic Engine Active
            </p>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-10 bg-indigo-100 rounded-full blur-[120px] opacity-35 animate-pulse pointer-events-none" />
          <OnboardingPlanner />
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
          <p className="text-slate-500 text-xl font-medium leading-relaxed">We&apos;ve automated the hard part of 11+ prep so you can focus on building confidence. Designed specifically for Year 4 and Year 5 students.</p>
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
            title="Adaptive Tutor"
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

      {/* New Readiness Section */}
      <section className="bg-slate-50 py-40 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-20 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-100 px-4 py-2 rounded-full mb-8">
              <Target className="h-4 w-4 text-amber-600" />
              <span className="text-xs font-bold text-amber-700 uppercase tracking-widest leading-none">Baseline Assessment</span>
            </div>
            <h2 className="text-5xl font-black text-slate-900 mb-8 leading-tight tracking-tight">
              Is your child <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500">11+ Ready?</span>
            </h2>
            <p className="text-slate-500 text-xl mb-10 leading-relaxed font-medium">
              Don&apos;t leave success to chance. Our rigorous diagnostic test uses real exam-standard questions to map your child&apos;s current ability against the 11+ requirements.
            </p>
            <ul className="space-y-4 mb-10">
              <li className="flex items-center gap-3 font-bold text-slate-700">
                <div className="h-6 w-6 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                  <Check className="h-3.5 w-3.5" />
                </div>
                Detailed Topic Breakdown
              </li>
              <li className="flex items-center gap-3 font-bold text-slate-700">
                <div className="h-6 w-6 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                  <Check className="h-3.5 w-3.5" />
                </div>
                Personalized Learning Recommendations
              </li>
              <li className="flex items-center gap-3 font-bold text-slate-700">
                <div className="h-6 w-6 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                  <Check className="h-3.5 w-3.5" />
                </div>
                No account required to start
              </li>
            </ul>
            <Link href="/diagnostic" className="inline-flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-200">
              Start Free Assessment
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>

          <div className="relative">
             <div className="absolute -inset-10 bg-amber-100 rounded-full blur-[120px] opacity-30" />
             <div className="relative bg-white p-8 rounded-[3rem] border border-slate-100 shadow-2xl">
                <div className="text-center mb-8">
                   <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Current Status</div>
                   <div className="text-4xl font-black text-slate-900">Developing</div>
                </div>
                
                <div className="h-4 w-full bg-slate-50 rounded-full overflow-hidden mb-8 border border-slate-100 flex items-center px-1">
                   <div className="h-2 w-[65%] bg-gradient-to-r from-amber-400 to-orange-500 rounded-full" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="text-[10px] font-black text-slate-400 uppercase mb-1">Score</div>
                      <div className="text-xl font-black text-slate-900">14/20</div>
                   </div>
                   <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100">
                      <div className="text-[10px] font-black text-indigo-400 uppercase mb-1">Goal</div>
                      <div className="text-xl font-black text-indigo-900">20/20</div>
                   </div>
                </div>

                <div className="mt-8 p-6 bg-indigo-600 rounded-3xl text-white">
                   <p className="text-sm font-medium italic opacity-90">&ldquo;Focus on Multi-step Word Problems to reach the Competent level.&rdquo;</p>
                </div>
             </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-24 lg:py-28">
        <div className="rounded-[3rem] border border-slate-100 bg-white p-8 shadow-sm lg:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-2">
                <BookOpen className="h-4 w-4 text-indigo-600" />
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-700">
                  Parent guides
                </span>
              </div>
              <h2 className="mt-5 text-4xl font-black tracking-tight text-slate-900">
                Browse practical 11+ guides before you choose the next step.
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-slate-500">
                Explore school-specific routes, exam formats, Year 4 and Year 5 planning, and the skill areas that most often need attention first.
              </p>
            </div>
            <Link
              href="/guides"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-6 py-3 font-bold text-slate-900 transition-all hover:border-indigo-200 hover:bg-white"
            >
              Browse all guides
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {featuredGuides.map((guide) => (
              <Link
                key={guide.href}
                href={guide.href}
                className="group rounded-[2rem] border border-slate-100 bg-slate-50 p-5 transition-all hover:border-indigo-100 hover:bg-white hover:shadow-md"
              >
                <h3 className="text-lg font-black tracking-tight text-slate-900 transition-colors group-hover:text-indigo-600">
                  {guide.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-500">
                  {guide.description}
                </p>
              </Link>
            ))}
          </div>
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
                Our adaptive platform builds a custom learning ladder for every student, ensuring they master the basics before moving to the high-difficulty challenges.
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

      {/* Parent Dashboard Showcase */}
      <section className="bg-white py-40 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row-reverse gap-20 items-center">
            <div className="lg:w-1/2">
              <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-full mb-8">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest leading-none">For Parents & Tutors</span>
              </div>
              <h2 className="text-5xl font-black text-slate-900 mb-8 leading-tight tracking-tight">
                Full visibility into <br />
                <span className="text-emerald-600">their progress.</span>
              </h2>
              <p className="text-slate-500 text-xl mb-12 leading-relaxed font-medium">
                No more guessing. Our dedicated parent dashboard gives you a deep-dive into exactly where your child is excelling and where they need a helping hand.
              </p>

              <div className="space-y-8">
                <div className="flex gap-4">
                  <div className="h-12 w-12 bg-slate-900 rounded-2xl flex items-center justify-center shrink-0 shadow-lg">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-slate-900 mb-2">&ldquo;Exam Trap&rdquo; Analysis</h4>
                    <p className="text-slate-500 text-sm leading-relaxed">Our engine identifies recurring patterns in mistakes, like rushing word problems or logic gaps, and summarizes them for you.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="h-12 w-12 bg-indigo-600 rounded-2xl flex items-center justify-center shrink-0 shadow-lg">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-slate-900 mb-2">Weekly Summary Emails</h4>
                    <p className="text-slate-500 text-sm leading-relaxed">Receive a professional progress report every Monday morning covering XP gained, topics mastered, and upcoming goals.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:w-1/2 relative">
              <div className="absolute -inset-10 bg-emerald-100 rounded-full blur-[100px] opacity-40" />
              <div className="relative bg-white p-4 rounded-[3.5rem] border border-slate-100 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] overflow-hidden">
                <div className="bg-slate-50 p-8 rounded-[2.8rem] border border-slate-200">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center border border-slate-200 shadow-sm">
                      <div className="h-4 w-4 bg-emerald-500 rounded-full" />
                    </div>
                    <span className="font-black text-slate-900">Student: Charlie J.</span>
                  </div>

                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm mb-6">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Exam Trap Identified</h5>
                    <p className="text-sm font-bold text-slate-800 leading-relaxed">
                      Charlie is consistently struggling with <span className="text-emerald-600 italic underline decoration-2">Multi-step Word Problems</span>.
                      He often skips the second operation in a question, leading to &ldquo;Near-Miss&rdquo; errors.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">XP Gained</div>
                      <div className="text-2xl font-black text-indigo-600">+1,240</div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Time Studied</div>
                      <div className="text-2xl font-black text-slate-900">4h 12m</div>
                    </div>
                  </div>
                </div>
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
                <PricingFeature text="Unlimited Smart Explanations" />
                <PricingFeature text="Parent Insight Dashboard" />
                <PricingFeature text="Detailed Diagnostic Exams" />
                <PricingFeature text="Study Guides & Cheat Sheets" />
                <PricingFeature text="Priority Support" />
              </div>

              <Link href="/signup" className="block w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-lg text-center hover:bg-slate-800 transition-all shadow-xl shadow-slate-200">
                Start Your 7-Day Free Trial
              </Link>
              <p className="text-center text-slate-400 text-[10px] font-bold mt-4 uppercase tracking-widest leading-relaxed">
                No charge until day 7. <br />
                Cancel any time before trial ends. <br />
                Subscription begins automatically unless cancelled.
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
              question="What age group is Ace 11+ intended for?"
              answer="Ace 11+ is specifically optimized for students in Year 4 and Year 5 (Ages 8-10) who are preparing to sit the 11+ exam at the start of Year 6. Starting early ensures a stress-free, adaptive learning path that builds foundational mastery before moving to high-difficulty challenges."
            />
            <FAQItem
              question="Is this suitable for both GL and CEM boards?"
              answer="Absolutely. Our question bank is dynamically updated to cover the specific logic and formatting of both GL Assessment and CEM, as well as common Private School entrance exams."
            />
            <FAQItem
              question="How does the smart tutoring work?"
              answer="Whenever a student gets a question wrong or feels stuck, they can click 'Explain'. Our system instantly analyzes the specific question and provides a child-friendly, step-by-step breakdown of how to reach the answer."
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
          <Link href="/guides" className="text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors">Guides</Link>
          <Link href="/privacy" className="text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors">Privacy</Link>
          <Link href="/terms" className="text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors">Terms</Link>
          <a href="mailto:support@ace11plus.org" className="text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors">Contact</a>
        </div>
        <p className="text-xs font-bold text-slate-300">© 2026 Ace 11+ Intelligence. All rights reserved.</p>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, desc, color }: { icon: React.ReactNode, title: string, desc: string, color: 'indigo' | 'violet' | 'emerald' }) {
  const colorMap: Record<'indigo' | 'violet' | 'emerald', string> = {
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

function Brain({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  )
}
