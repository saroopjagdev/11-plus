'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Trophy, Flag, Rocket, Target, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ExamRoadmapProps {
  overallAccuracy: number
  daysRemaining: number | null
  examDate: string | null
}

export function ExamRoadmap({ overallAccuracy, daysRemaining, examDate }: ExamRoadmapProps) {
  // Phase logic based on accuracy
  // 0-30: Foundations
  // 31-70: Build Strength
  // 71-85: Accuracy & Speed
  // 86+: Exam Master
  
  const phases = [
    { label: 'Foundation', threshold: 0, icon: <Rocket className="h-4 w-4" /> },
    { label: 'Strength', threshold: 20, icon: <Target className="h-4 w-4" /> },
    { label: 'Strategy', threshold: 50, icon: <ShieldCheck className="h-4 w-4" /> },
    { label: 'Mastery', threshold: 80, icon: <Trophy className="h-4 w-4" /> }
  ]

  const currentPhaseIndex = phases.reduce((acc, phase, idx) => {
    return overallAccuracy >= phase.threshold ? idx : acc
  }, 0)

  return (
    <section className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm overflow-hidden relative">
      <header className="flex items-center justify-between mb-10">
        <div>
          <h3 className="text-xl font-black text-slate-900">Your Learning Path</h3>
          <p className="text-slate-500 text-sm font-medium">Tracking your journey to exam readiness.</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Overall Readiness</p>
          <p className="text-3xl font-black text-indigo-600">{Math.round(overallAccuracy)}%</p>
        </div>
      </header>

      {/* The Map Line */}
      <div className="relative pt-8 pb-12">
        <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -translate-y-1/2 rounded-full" />
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${overallAccuracy}%` }}
          className="absolute top-1/2 left-0 h-1 bg-indigo-600 -translate-y-1/2 rounded-full shadow-[0_0_15px_rgba(79,70,229,0.3)]"
        />

        <div className="relative flex justify-between">
          {phases.map((phase, i) => {
            const isCompleted = overallAccuracy >= (phases[i+1]?.threshold || 100)
            const isActive = i === currentPhaseIndex
            
            return (
              <div key={phase.label} className="flex flex-col items-center gap-4">
                <div className={cn(
                  "h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-500 border-2",
                  isCompleted ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100" :
                  isActive ? "bg-white border-indigo-600 text-indigo-600 shadow-xl scale-110" :
                  "bg-white border-slate-100 text-slate-300"
                )}>
                  {phase.icon}
                </div>
                <div className="text-center">
                  <p className={cn(
                    "text-[10px] font-black uppercase tracking-widest",
                    isActive ? "text-indigo-600" : "text-slate-400"
                  )}>{phase.label}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {examDate && (
        <div className="mt-4 flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <Flag className="h-5 w-5 text-indigo-600" />
          <p className="text-sm font-bold text-slate-600">
            Next Milestone: Achieve <span className="text-slate-900">85% Mastery</span> in all topics by {new Date(examDate).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}.
          </p>
        </div>
      )}
    </section>
  )
}
