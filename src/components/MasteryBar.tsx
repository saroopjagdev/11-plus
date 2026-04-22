'use client'

import React from 'react'
import { motion } from 'framer-motion'

interface MasteryBarProps {
  label: string
  progress: number
  color: string
}

export function MasteryBar({ label, progress, color }: MasteryBarProps) {
  return (
    <div>
      <div className="flex justify-between items-center text-sm font-bold mb-1">
        <span className="text-slate-700">{label}</span>
        <span className="text-slate-400">{progress}%</span>
      </div>
      <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full ${color} rounded-full`}
        />
      </div>
    </div>
  )
}
