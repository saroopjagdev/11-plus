'use client'

import React from 'react'
import { motion } from 'framer-motion'

interface MasteryBarProps {
  label: string
  progress: number
  color: string
  status: string
  accuracy: number
  evidence: string
}

export function MasteryBar({ label, progress, color, status, accuracy, evidence }: MasteryBarProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-start gap-4">
        <div>
          <div className="text-sm font-bold text-slate-700">{label}</div>
          <div className="text-xs font-bold uppercase tracking-widest text-slate-400">{status}</div>
        </div>
        <div className="text-right">
          <div className="text-sm font-black text-slate-700">{accuracy}% accuracy</div>
          <div className="text-xs font-bold text-slate-400">{evidence}</div>
        </div>
      </div>
      <div className="h-2.5 w-full bg-slate-50 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full ${color} rounded-full`}
        />
      </div>
      <div className="text-[11px] font-bold text-slate-400">{progress}% progress to next milestone</div>
    </div>
  )
}
