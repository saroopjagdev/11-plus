'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, Play, ArrowLeft } from 'lucide-react'

interface PrerequisiteWarningModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  onGoToPrerequisite: () => void
  topic: string
  prerequisite: string | null
}

export function PrerequisiteWarningModal({ 
  isOpen, 
  onClose, 
  onConfirm,
  onGoToPrerequisite, 
  topic, 
  prerequisite 
}: PrerequisiteWarningModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20"
      >
        <div className="p-8 text-center space-y-6">
          <div className="h-16 w-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
             <AlertCircle className="h-8 w-8 text-amber-500" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Wait a second!</h3>
            <p className="text-slate-500 font-medium leading-relaxed">
              Master <span className="text-indigo-600 font-bold">{prerequisite}</span> first to unlock <span className="font-bold text-slate-700">{topic}</span>. Bronze mastery needs at least 20 questions with strong accuracy.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={onConfirm}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 group"
            >
              Continue Anyway
              <Play className="h-4 w-4 fill-current group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={onGoToPrerequisite}
              className="w-full py-4 bg-slate-100 text-slate-700 rounded-2xl font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2 group"
            >
              Go to {prerequisite}
              <Play className="h-4 w-4 fill-current group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={onClose}
              className="w-full py-3 text-slate-400 font-bold text-sm hover:text-slate-600 transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Stay Here
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
