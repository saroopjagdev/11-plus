'use client'

import React, { useState } from 'react'
import { AvatarSelector } from '@/components/AvatarSelector'
import { getLevelProgress, getXPThreshold } from '@/lib/gamification'
import { AVATAR_COLLECTION } from '@/lib/constants/avatars'
import { BarChart3, Edit2, TrendingUp, Award } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface DashboardStudentProfileProps {
  child: {
    id: string
    name: string
    xp: number
    level: number
    avatar_url: string | null
    current_streak: number
    target_exams?: string[] | null
  }
}

export function DashboardStudentProfile({ child }: DashboardStudentProfileProps) {
  const [showSelector, setShowSelector] = useState(false)
  const currentAvatar = AVATAR_COLLECTION.find(a => a.id === child.avatar_url)
  const progress = getLevelProgress(child.xp)
  const nextLevelXP = getXPThreshold(child.level)

  return (
    <>
      <section className="bg-indigo-50 rounded-3xl p-8 border border-indigo-100 relative overflow-hidden">
        {/* Background Accent */}
        <div className="absolute top-0 right-0 p-4 opacity-5">
           <Award className="h-24 w-24" />
        </div>

        <div className="flex items-center justify-between mb-6 relative z-10">
          <h3 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Rank & Level
          </h3>
          <span className="px-3 py-1 bg-indigo-600 text-white text-[10px] font-black rounded-full uppercase tracking-widest">
            Level {child.level}
          </span>
        </div>

        <div className="bg-white p-6 rounded-[2rem] shadow-sm relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative group">
              <div className={`h-16 w-16 ${currentAvatar?.bgColor || 'bg-indigo-100'} rounded-2xl flex items-center justify-center text-3xl shadow-inner border-2 border-white`}>
                {currentAvatar?.emoji || child.name[0]}
              </div>
              <button 
                onClick={() => setShowSelector(true)}
                className="absolute -bottom-1 -right-1 p-1.5 bg-white rounded-lg shadow-md border border-slate-100 text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                <Edit2 className="h-3 w-3" />
              </button>
            </div>
            <div>
              <p className="font-black text-slate-900 text-xl tracking-tight">{child.name}</p>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mt-0.5">
                <span className="text-indigo-600">Streak: {child.current_streak} days</span>
                <span className="h-1 w-1 bg-slate-200 rounded-full" />
                <span>Expert Student</span>
              </div>
            </div>
          </div>

          {/* Target Exams */}
          {child.target_exams && child.target_exams.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-6">
              {child.target_exams.map((exam) => (
                <span 
                  key={exam}
                  className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[8px] font-black rounded-md border border-indigo-100 uppercase tracking-wider"
                >
                  {exam}
                </span>
              ))}
            </div>
          )}

          {/* XP Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-end text-[10px] font-bold uppercase tracking-widest text-slate-400">
              <span>XP: {child.xp}</span>
              <span>Next Level: {nextLevelXP}</span>
            </div>
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner p-0.5 flex items-center">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-2 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
              />
            </div>
            <p className="text-[10px] text-center font-bold text-indigo-400 mt-1">{progress}% to Level {child.level + 1}</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
           <div className="bg-white/50 p-3 rounded-2xl border border-indigo-100/50 text-center">
              <p className="text-[10px] font-bold text-indigo-400 uppercase mb-1">Global Rank</p>
              <p className="font-black text-indigo-900">#42</p>
           </div>
           <div className="bg-white/50 p-3 rounded-2xl border border-indigo-100/50 text-center">
              <p className="text-[10px] font-bold text-indigo-400 uppercase mb-1">XP Today</p>
              <p className="font-black text-indigo-900">+120</p>
           </div>
        </div>
      </section>

      <AnimatePresence>
        {showSelector && (
          <AvatarSelector 
            childId={child.id} 
            currentAvatarId={child.avatar_url || undefined} 
            onClose={() => setShowSelector(false)} 
          />
        )}
      </AnimatePresence>
    </>
  )
}
