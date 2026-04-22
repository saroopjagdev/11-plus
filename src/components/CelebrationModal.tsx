'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Star, ArrowRight, PartyPopper } from 'lucide-react'
import Confetti from 'react-confetti'
import { useWindowSize } from 'react-use'

interface CelebrationModalProps {
  isOpen: boolean
  type: 'level-up' | 'streak-milestone'
  level?: number
  streak?: number
  onClose: () => void
}

export function CelebrationModal({ isOpen, type, level, streak, onClose }: CelebrationModalProps) {
  const { width, height } = useWindowSize()

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
          />
          
          <Confetti
            width={width}
            height={height}
            recycle={false}
            numberOfPieces={500}
            colors={['#4f46e5', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444']}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 40 }}
            className="relative w-full max-w-lg bg-white rounded-[3rem] p-10 shadow-2xl text-center overflow-hidden"
          >
            {/* Decorative Orbs */}
            <div className="absolute -top-20 -left-20 h-40 w-40 bg-indigo-500/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -right-20 h-40 w-40 bg-amber-500/10 rounded-full blur-3xl" />

            <div className="relative z-10">
              <div className="h-24 w-24 bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl rotate-3">
                {type === 'level-up' ? (
                  <Trophy className="h-12 w-12 text-white" />
                ) : (
                  <PartyPopper className="h-12 w-12 text-white" />
                )}
              </div>

              <h2 className="text-4xl font-black text-slate-900 mb-2">
                {type === 'level-up' ? 'LEVEL UP!' : 'AMAZING STREAK!'}
              </h2>
              <p className="text-xl font-bold text-indigo-600 mb-8 uppercase tracking-widest">
                {type === 'level-up' ? `You reached Level ${level}` : `${streak} Days Strong`}
              </p>

              <div className="bg-slate-50 p-6 rounded-2xl mb-8 border border-slate-100">
                <p className="text-slate-500 font-medium leading-relaxed">
                  {type === 'level-up' 
                    ? "Your consistency is paying off! You've unlocked even more challenges on your 11+ journey." 
                    : "You're building an incredible learning habit. Keep showing up every day to reach the top!"}
                </p>
              </div>

              <button
                onClick={onClose}
                className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-lg hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-2"
              >
                Keep Exploring
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
