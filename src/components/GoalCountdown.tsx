'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Calendar, Target, School, ChevronRight, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

interface GoalCountdownProps {
  examDate: string | null
  childName: string
}

export function GoalCountdown({ examDate, childName }: GoalCountdownProps) {
  if (!examDate) {
    return (
      <section className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <div className="h-12 w-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
            <Target className="h-6 w-6 text-indigo-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Set Your Exam Date</h3>
          <p className="text-sm text-slate-500 mb-6 leading-relaxed">
            Tell us your primary exam date to unlock a personalized study roadmap for {childName}.
          </p>
          <button className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
            Setup My Goals
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        {/* Decorative background element */}
        <div className="absolute -right-8 -bottom-8 h-32 w-32 bg-indigo-50 rounded-full opacity-50 blur-2xl" />
      </section>
    )
  }

  const daysLeft = examDate ? Math.max(0, Math.ceil((new Date(examDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : null
  const progressPercent = daysLeft !== null ? Math.min(100, Math.max(0, 100 - (daysLeft / 365) * 100)) : 0

  return (
    <section className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
      <div className="relative z-10 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-500/20 rounded-xl">
               <Calendar className="h-5 w-5 text-indigo-400" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Exam Countdown</span>
          </div>
          {daysLeft !== null && (
            <span className="text-[10px] font-black bg-white/10 px-3 py-1 rounded-full uppercase tracking-widest text-indigo-200">
              {daysLeft} Days to go
            </span>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-baseline gap-1">
             <span className="text-6xl font-black tracking-tighter">
               {daysLeft !== null ? daysLeft : '--'}
             </span>
             <span className="text-indigo-400 font-bold uppercase tracking-widest text-xs">Days</span>
          </div>
          <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
             <motion.div 
               initial={{ width: 0 }}
               animate={{ width: `${progressPercent}%` }}
               className="h-full bg-gradient-to-r from-indigo-500 to-violet-500"
             />
          </div>
        </div>
      </div>

      {/* Decorative */}
      <div className="absolute -right-16 -top-16 h-64 w-64 bg-indigo-500/10 rounded-full blur-[80px]" />
      <div className="absolute -left-16 -bottom-16 h-64 w-64 bg-violet-500/10 rounded-full blur-[80px]" />
    </section>
  )
}
