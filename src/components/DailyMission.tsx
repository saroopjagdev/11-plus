'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Zap, Target, Sparkles, CheckCircle2, ChevronRight, Lock } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface DailyMissionProps {
  recommendations: {
    id: string
    subject: string
    topic: string
    type: 'warmup' | 'focus' | 'challenge'
    action: {
      label: string
      href: string
    }
  }[]
  childName: string
  isComplete?: boolean
  completedTopics?: string[]
  isPro: boolean
  mockDoneToday?: boolean
}

export function DailyMission({ recommendations, childName, isComplete, completedTopics = [], isPro, mockDoneToday = false }: DailyMissionProps) {
  const missionIcons = {
    warmup: <Zap className="h-5 w-5 text-amber-400 fill-current" />,
    focus: <Target className="h-5 w-5 text-indigo-400" />,
    challenge: <Sparkles className="h-5 w-5 text-violet-400" />
  }

  const missionColors = {
    warmup: 'border-amber-500/20 bg-amber-500/5',
    focus: 'border-indigo-500/20 bg-indigo-500/5',
    challenge: 'border-violet-500/20 bg-violet-500/5'
  }

  return (
    <section className={cn(
      "rounded-[2.5rem] p-8 text-white relative overflow-hidden border transition-all duration-700",
      isComplete ? "bg-gradient-to-br from-indigo-900 via-slate-900 to-violet-900 border-indigo-500/30 shadow-2xl shadow-indigo-500/20" : "bg-slate-900 border-white/5"
    )}>
      <div className="relative z-10 space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black tracking-tight">
              {isComplete ? "Daily Missions Complete!" : "Today's Mission"}
            </h2>
            <p className="text-slate-400 font-medium">
              {isComplete 
                ? `You've crushed your goals for today, ${childName}. Ready for a bonus challenge?` 
                : `Complete these ${recommendations.length} steps to stay on track for ${childName}.`}
            </p>
          </div>
          <div className={cn(
            "h-14 w-14 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-500",
            isComplete ? "bg-emerald-500 shadow-emerald-500/20 scale-110" : "bg-indigo-600 shadow-indigo-500/20"
          )}>
             {isComplete ? <CheckCircle2 className="h-7 w-7 text-white" /> : <Target className="h-7 w-7 text-white" />}
          </div>
        </header>

        {isComplete ? (
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 p-8 bg-white/5 rounded-[2rem] border border-white/10 backdrop-blur-sm relative overflow-hidden group">
               <div className="relative z-10">
                  <div className="flex items-center gap-2 text-indigo-400 font-black text-[10px] uppercase tracking-widest mb-4">
                     {isPro && mockDoneToday ? (
                       <><CheckCircle2 className="h-3 w-3 text-emerald-400" /> Done for today</>
                     ) : (
                       <><Lock className="h-3 w-3" /> {isPro ? 'Elite Guidance' : 'Pro Upgrade'}</>
                     )}
                  </div>
                  <h3 className="text-2xl font-black mb-2">Simulate an Exam</h3>
                  <p className="text-slate-400 text-sm mb-8 max-w-sm">
                    {isPro
                      ? mockDoneToday
                        ? "You've already sat a mock exam today — nice work. You can take another one any time if you want extra stamina practice."
                        : 'Missions are done, but exam stamina is built in mocks. Try a 40-question timed simulation in your weakest subject.'
                      : "You have finished today's mission. Upgrade to unlock full mock exams and build timed exam stamina with longer papers."}
                  </p>
                  <Link href={isPro ? "/practice/mock/Mixed" : "/pricing"} className="inline-flex items-center gap-3 px-8 py-4 bg-white text-slate-900 rounded-2xl font-bold text-sm hover:bg-indigo-50 transition-all shadow-xl shadow-white/5">
                     {isPro ? (mockDoneToday ? 'Take Another Mock' : 'Start Full Mock Exam') : 'Unlock Full Mock Exams'}
                     <ChevronRight className="h-4 w-4" />
                  </Link>
               </div>
               <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 blur-[80px] rounded-full opacity-20 -mr-16 -mt-16 group-hover:opacity-40 transition-opacity" />
            </div>

            <div className="md:w-1/3 p-8 bg-white/5 rounded-[2rem] border border-white/10 backdrop-blur-sm">
               <div className="flex items-center gap-2 text-violet-400 font-black text-[10px] uppercase tracking-widest mb-4">
                  <Zap className="h-3 w-3" /> Mastery Bonus
               </div>
               <h3 className="text-xl font-black mb-2">Speed Drill</h3>
               <p className="text-slate-400 text-xs mb-6">Complete 20 Arithmetic questions in under 5 minutes.</p>
               <Link href="/practice/topic/Arithmetic?length=20&mode=mcq" className="text-sm font-bold text-white hover:text-indigo-300 transition-colors flex items-center gap-2">
                  Start Speed Drill <ChevronRight className="h-4 w-4" />
               </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recommendations.map((rec, i) => {
              const isDone = completedTopics.includes(rec.topic)
              
              return (
                <motion.div
                  key={rec.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={cn(
                    "group relative p-6 rounded-3xl border transition-all",
                    !isDone && "hover:scale-[1.02] active:scale-[0.98]",
                    missionColors[rec.type],
                    isDone && "opacity-50 grayscale-[0.5]"
                  )}
                >
                  <div className={cn("flex flex-col h-full space-y-4", isDone && "pointer-events-none")}>
                    <div className="flex items-center justify-between">
                      <div className="p-2 bg-white/5 rounded-xl">
                        {isDone ? <CheckCircle2 className="h-5 w-5 text-emerald-400" /> : missionIcons[rec.type]}
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                        {isDone ? 'Done' : `Step ${i + 1}`}
                      </span>
                    </div>
                    
                    <div className="flex-1">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-1">
                        {isDone ? 'Mission Accomplished' : rec.type}
                      </h4>
                      <p className={cn(
                        "text-lg font-bold leading-tight transition-colors",
                        !isDone && "group-hover:text-indigo-300"
                      )}>
                        {rec.action.label}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <span className="text-xs font-bold text-slate-500">{rec.subject}</span>
                      {!isDone ? (
                        <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-white transition-colors" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      )}
                    </div>

                    {!isDone && (
                      <Link href={rec.action.href} className="absolute inset-0 z-10">
                        <span className="sr-only">Start {rec.action.label}</span>
                      </Link>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Decorative background effects */}
      <div className="absolute -right-24 -top-24 h-64 w-64 bg-indigo-600/10 rounded-full blur-[100px]" />
      <div className="absolute -left-24 -bottom-24 h-64 w-64 bg-violet-600/10 rounded-full blur-[100px]" />
    </section>
  )
}
