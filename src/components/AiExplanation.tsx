'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, ThumbsUp, ThumbsDown, Loader2, X } from 'lucide-react'
import { saveExplanation } from '@/app/actions/explain'

interface AiExplanationProps {
  questionId: string
  onClose: () => void
}

export function AiExplanation({ questionId, onClose }: AiExplanationProps) {
  const [explanation, setExplanation] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [feedbackGiven, setFeedbackGiven] = useState(false)
  const [errorHeader, setErrorHeader] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    async function fetchExplanation() {
      try {
        const res = await fetch('/api/explain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ questionId })
        })
        const data = await res.json()
        if (data.explanation) {
          setExplanation(data.explanation)
        } else if (data.error) {
          setErrorHeader(data.error)
          setErrorMessage(data.message)
        }
      } catch (err) {
        console.error('Fetch explanation error:', err)
        setErrorHeader('Oops! Something went wrong.')
      } finally {
        setLoading(false)
      }
    }
    fetchExplanation()
  }, [questionId])

  const handleFeedback = async (isHelpful: boolean) => {
    setFeedbackGiven(true)
    if (isHelpful && explanation) {
      await saveExplanation(questionId, explanation)
    }
    // For MVP, we just close or show a thank you message after a delay
    setTimeout(onClose, 1500)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl shadow-indigo-200/50 overflow-hidden border-2 border-indigo-50"
      >
        <div className="bg-indigo-600 px-8 py-6 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl">
              <Sparkles className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-lg">Tutor Explanation</h3>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-full transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Loader2 className="h-10 w-10 text-indigo-600 animate-spin mb-4" />
              <p className="text-slate-500 font-medium">Generating a child-friendly explanation...</p>
            </div>
          ) : explanation ? (
            <div className="space-y-4">
              <div className="prose prose-slate prose-indigo max-w-none">
                {explanation.split('\n').map((line, i) => (
                  <p key={i} className="text-slate-700 leading-relaxed min-h-[1em]">
                    {line}
                  </p>
                ))}
              </div>

              {!feedbackGiven && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-8 pt-6 border-t border-slate-100 text-center"
                >
                  <p className="text-sm font-bold text-slate-500 mb-4 uppercase tracking-wider">Was this helpful?</p>
                  <div className="flex justify-center gap-4">
                    <button
                      onClick={() => handleFeedback(true)}
                      className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-6 py-2 rounded-xl font-bold hover:bg-emerald-100 transition-colors"
                    >
                      <ThumbsUp className="h-4 w-4" /> Yes
                    </button>
                    <button
                      onClick={() => handleFeedback(false)}
                      className="flex items-center gap-2 bg-slate-50 text-slate-500 px-6 py-2 rounded-xl font-bold hover:bg-slate-100 transition-colors"
                    >
                      <ThumbsDown className="h-4 w-4" /> Not really
                    </button>
                  </div>
                </motion.div>
              )}

              {feedbackGiven && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-8 bg-emerald-50 p-4 rounded-2xl text-emerald-700 font-bold text-center"
                >
                  Thanks for the feedback! 🌟
                </motion.div>
              )}
            </div>
          ) : (
             <div className="text-center py-12 px-4">
                <div className="bg-rose-50 p-6 rounded-3xl border border-rose-100">
                  <p className="text-rose-900 font-bold text-lg mb-2">{errorHeader || 'Oops! Something went wrong.'}</p>
                  <p className="text-rose-600 text-sm leading-relaxed">{errorMessage || 'We encountered an error generating your explanation. Please try again later.'}</p>
                </div>
                <button 
                  onClick={onClose} 
                  className="mt-8 bg-slate-900 text-white px-8 py-3 rounded-2xl font-bold hover:bg-slate-800 transition-all"
                >
                  Close
                </button>
             </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
