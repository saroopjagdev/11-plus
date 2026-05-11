'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Zap, Star, ShieldCheck, X } from 'lucide-react'
import Link from 'next/link'

interface ProUpsellModalProps {
  isOpen: boolean
  onClose: () => void
  featureName: string
  featureDesc: string
}

export function ProUpsellModal({ isOpen, onClose, featureName, featureDesc }: ProUpsellModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border-2 border-indigo-50"
      >
        <div className="bg-indigo-600 p-8 text-white text-center relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="h-16 w-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-black mb-2">Unlock {featureName}</h2>
          <p className="text-indigo-100 font-medium text-sm">{featureDesc}</p>
        </div>

        <div className="p-8 space-y-6">
          <div className="space-y-4">
             <div className="flex items-center gap-3">
                <div className="h-6 w-6 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
                   <ShieldCheck className="h-4 w-4" />
                </div>
                <p className="text-sm font-bold text-slate-700">Unlimited AI Tutor Explanations</p>
             </div>
             <div className="flex items-center gap-3">
                <div className="h-6 w-6 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
                   <ShieldCheck className="h-4 w-4" />
                </div>
                <p className="text-sm font-bold text-slate-700">Instant AI Answer Marking</p>
             </div>
             <div className="flex items-center gap-3">
                <div className="h-6 w-6 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
                   <ShieldCheck className="h-4 w-4" />
                </div>
                <p className="text-sm font-bold text-slate-700">Full Timed Mock Exams</p>
             </div>
          </div>

          <Link 
            href="/pricing"
            className="block w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg text-center hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
          >
            Upgrade to Pro
          </Link>
          <button 
            onClick={onClose}
            className="w-full text-slate-400 font-bold text-sm hover:text-slate-600 transition-colors"
          >
            Maybe later
          </button>
        </div>
      </motion.div>
    </div>
  )
}
