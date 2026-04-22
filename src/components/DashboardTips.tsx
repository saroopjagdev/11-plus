'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { EXAM_TIPS, ExamTip } from '@/lib/constants/exam_tips'
import { Lightbulb, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react'

export function DashboardTips() {
  const [index, setIndex] = useState(0)

  // Use a predictable seed or just current day of month to rotate
  useEffect(() => {
    const day = new Date().getDate()
    setIndex(day % EXAM_TIPS.length)
  }, [])

  const currentTip = EXAM_TIPS[index]

  const nextTip = () => setIndex((index + 1) % EXAM_TIPS.length)
  const prevTip = () => setIndex((index - 1 + EXAM_TIPS.length) % EXAM_TIPS.length)

  return (
    <section className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm overflow-hidden relative group">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-amber-50 rounded-xl flex items-center justify-center">
            <Lightbulb className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">Exam Strategy</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">Boost Your Score</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <button onClick={prevTip} className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400">
             <ChevronLeft className="h-4 w-4" />
           </button>
           <button onClick={nextTip} className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400">
             <ChevronRight className="h-4 w-4" />
           </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentTip.id}
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -20, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="relative z-10"
        >
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase mb-4">
             <Sparkles className="h-3 w-3" />
             {currentTip.category}
          </div>
          <h4 className="text-xl font-black text-slate-900 mb-3 tracking-tight">{currentTip.title}</h4>
          <p className="text-slate-500 leading-relaxed text-sm">{currentTip.content}</p>
        </motion.div>
      </AnimatePresence>

      {/* Decorative Background */}
      <div className="absolute -right-10 -bottom-10 h-40 w-40 bg-amber-50 rounded-full blur-3xl opacity-50 group-hover:bg-indigo-50 transition-colors" />
    </section>
  )
}
