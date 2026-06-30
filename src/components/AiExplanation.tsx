'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, ThumbsUp, ThumbsDown, Loader2, X } from 'lucide-react'
import { saveExplanation } from '@/app/actions/explain'
import ReactMarkdown from 'react-markdown'
import { ReportIssueButton } from '@/components/ReportIssueButton'

interface AiExplanationProps {
  questionId: string
  learnerAnswer?: string | null
  onClose: () => void
  userEmail?: string | null
  childId?: string | null
  sessionId?: string | null
  isPro?: boolean
  // When the question already ships with a verified explanation, show it
  // instantly instead of making a live AI call.
  presetExplanation?: string | null
}

export function AiExplanation({
  questionId,
  learnerAnswer,
  onClose,
  userEmail,
  childId,
  sessionId,
  isPro = false,
  presetExplanation,
}: AiExplanationProps) {
  const [explanation, setExplanation] = useState<string | null>(presetExplanation || null)
  const [answerReview, setAnswerReview] = useState<string | null>(null)
  const [loading, setLoading] = useState(!presetExplanation)
  const [feedbackGiven, setFeedbackGiven] = useState(false)
  const [errorHeader, setErrorHeader] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    // Pre-generated explanation: render immediately, no network call.
    if (presetExplanation) {
      setExplanation(presetExplanation)
      setLoading(false)
      return
    }

    async function fetchExplanation() {
      try {
        const res = await fetch('/api/explain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ questionId, learnerAnswer }),
        })
        const data = await res.json()
        if (data.explanation) {
          setExplanation(data.explanation)
          setAnswerReview(data.answerReview || null)
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
  }, [learnerAnswer, questionId, presetExplanation])

  const handleFeedback = async (isHelpful: boolean) => {
    setFeedbackGiven(true)
    if (isHelpful && explanation) {
      await saveExplanation(questionId, explanation)
    }
    setTimeout(onClose, 1500)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="w-full max-w-xl overflow-hidden rounded-[2.5rem] border-2 border-indigo-50 bg-white shadow-2xl shadow-indigo-200/50"
      >
        <div className="flex items-center justify-between bg-indigo-600 px-8 py-6 text-white">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/20 p-2">
              <Sparkles className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold">Tutor Explanation</h3>
          </div>
          <button onClick={onClose} className="rounded-full p-2 transition-colors hover:bg-white/20">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="custom-scrollbar max-h-[60vh] overflow-y-auto p-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Loader2 className="mb-4 h-10 w-10 animate-spin text-indigo-600" />
              <p className="font-medium text-slate-500">Generating a child-friendly explanation...</p>
            </div>
          ) : explanation ? (
            <div className="space-y-4">
              <div className="prose prose-slate prose-indigo max-w-none font-medium leading-relaxed text-slate-700">
                {answerReview && (
                  <div className="not-prose mb-4 rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-900">
                    {answerReview}
                  </div>
                )}
                <ReactMarkdown>{explanation}</ReactMarkdown>
              </div>

              {!feedbackGiven && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-8 border-t border-slate-100 pt-6 text-center"
                >
                  <p className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-500">Was this helpful?</p>
                  <div className="flex justify-center gap-4">
                    <button
                      onClick={() => handleFeedback(true)}
                      className="flex items-center gap-2 rounded-xl bg-emerald-50 px-6 py-2 font-bold text-emerald-700 transition-colors hover:bg-emerald-100"
                    >
                      <ThumbsUp className="h-4 w-4" /> Yes
                    </button>
                    <button
                      onClick={() => handleFeedback(false)}
                      className="flex items-center gap-2 rounded-xl bg-slate-50 px-6 py-2 font-bold text-slate-500 transition-colors hover:bg-slate-100"
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
                  className="mt-8 rounded-2xl bg-emerald-50 p-4 text-center font-bold text-emerald-700"
                >
                  Thanks for the feedback!
                </motion.div>
              )}

              <div className="flex justify-end pt-2">
                <ReportIssueButton
                  label="Report an explanation issue"
                  category="Explanation not helpful"
                  userEmail={userEmail}
                  childId={childId}
                  sessionId={sessionId}
                  questionId={questionId}
                  context={{
                    pageLabel: 'AI Explanation',
                    learnerAnswer,
                    isPro,
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="px-4 py-12 text-center">
              <div className="rounded-3xl border border-rose-100 bg-rose-50 p-6">
                <p className="mb-2 text-lg font-bold text-rose-900">{errorHeader || 'Oops! Something went wrong.'}</p>
                <p className="text-sm leading-relaxed text-rose-600">
                  {errorMessage || 'We encountered an error generating your explanation. Please try again later.'}
                </p>
              </div>
              <div className="mt-6 flex items-center justify-center gap-4">
                <button
                  onClick={onClose}
                  className="rounded-2xl bg-slate-900 px-8 py-3 font-bold text-white transition-all hover:bg-slate-800"
                >
                  Close
                </button>
                <ReportIssueButton
                  label="Report this problem"
                  category="Something failed"
                  userEmail={userEmail}
                  childId={childId}
                  sessionId={sessionId}
                  questionId={questionId}
                  context={{
                    pageLabel: 'AI Explanation Error',
                    learnerAnswer,
                    isPro,
                    errorHeader,
                    errorMessage,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
