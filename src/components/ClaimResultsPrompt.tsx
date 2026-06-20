'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, X, ArrowRight, Loader2 } from 'lucide-react'
import { claimGuestDiagnostic, type DiagnosticTopicBreakdown } from '@/app/actions/diagnostic'
import { useRouter } from 'next/navigation'

interface ClaimResultsPromptProps {
  childId: string
  shouldClearGuestCache?: boolean
}

interface GuestDiagnosticCache {
  score: number
  breakdown: DiagnosticTopicBreakdown[]
  aiSummary: string
  timestamp: string
}

export function ClaimResultsPrompt({ childId, shouldClearGuestCache = false }: ClaimResultsPromptProps) {
  const [isDismissed, setIsDismissed] = useState(false)
  const [isClaiming, setIsClaiming] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (shouldClearGuestCache) {
      localStorage.removeItem('ace_diagnostic_guest')
    }
  }, [shouldClearGuestCache])

  const guestData = useMemo(() => {
    if (shouldClearGuestCache || isDismissed || typeof window === 'undefined') {
      return null
    }

    const data = localStorage.getItem('ace_diagnostic_guest')
    if (!data) return null

    try {
      const parsed = JSON.parse(data) as GuestDiagnosticCache
      return {
        ...parsed,
        breakdown: parsed.breakdown.map((item) => ({
          topic: item.topic,
          subject: item.subject,
          accuracy: item.accuracy,
          questions_answered: item.questions_answered || 0,
        })),
      }
    } catch (error) {
      console.error('Failed to parse guest data', error)
      return null
    }
  }, [isDismissed, shouldClearGuestCache])

  const handleClaim = async () => {
    if (!guestData || !childId) return
    setIsClaiming(true)
    setErrorMessage(null)

    try {
      const response = await claimGuestDiagnostic(childId, guestData)
      if (response.success) {
        localStorage.removeItem('ace_diagnostic_guest')
        setIsDismissed(true)
        router.refresh()
      } else {
        setErrorMessage(response.error || 'We could not claim that diagnostic right now.')
      }
    } catch (error) {
      console.error('Failed to claim results', error)
      setErrorMessage('We could not claim that diagnostic right now.')
    } finally {
      setIsClaiming(false)
    }
  }

  if (!guestData || shouldClearGuestCache) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="bg-indigo-600 text-white overflow-hidden relative"
      >
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-indigo-100" />
            </div>
            <div>
              <p className="font-bold text-sm">Diagnostic Results Found!</p>
              <p className="text-xs text-indigo-100">
                Claim your previous score of {guestData.score}/20 to unlock your personalized study path.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleClaim}
              disabled={isClaiming}
              className="bg-white text-indigo-600 px-6 py-2 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              {isClaiming ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Claim Results'}
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => setIsDismissed(true)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Dismiss"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="max-w-6xl mx-auto px-4 pb-4">
            <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-indigo-50">
              {errorMessage}
            </div>
          </div>
        )}

        <div className="absolute top-0 right-1/4 h-full w-40 bg-gradient-to-l from-white/10 to-transparent skew-x-12 pointer-events-none" />
      </motion.div>
    </AnimatePresence>
  )
}
