'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ChevronRight, Sparkles, Target } from 'lucide-react'
import type { DiagnosticTopicBreakdown } from '@/app/actions/diagnostic'
import { ReportIssueButton } from '@/components/ReportIssueButton'

interface PendingDiagnosticSummary {
  score: number
  status: string
  aiSummary: string | null
  completedAt: string | null
}

interface GuestDiagnosticCache {
  score: number
  breakdown: DiagnosticTopicBreakdown[]
  aiSummary: string
  timestamp: string
}

function getDiagnosticStatus(score: number, totalQuestions = 20) {
  const ratio = totalQuestions > 0 ? score / totalQuestions : 0

  if (ratio === 1) return '11+ Ready'
  if (ratio >= 0.86) return 'Competent'
  if (ratio >= 0.61) return 'Developing'
  return 'Foundation'
}

function formatDiagnosticDate(dateString: string | null | undefined) {
  if (!dateString) return null

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateString))
}

export function DiagnosticsNoChildState({
  serverPendingDiagnostic,
}: {
  serverPendingDiagnostic: PendingDiagnosticSummary | null
}) {
  const [localDiagnostic] = useState<PendingDiagnosticSummary | null>(() => {
    if (typeof window === 'undefined') {
      return null
    }

    try {
      const raw = window.localStorage.getItem('ace_diagnostic_guest')
      if (!raw) return null

      const parsed = JSON.parse(raw) as GuestDiagnosticCache
      if (typeof parsed.score !== 'number') return null

      return {
        score: parsed.score,
        status: getDiagnosticStatus(parsed.score, 20),
        aiSummary: parsed.aiSummary || null,
        completedAt: parsed.timestamp || null,
      }
    } catch (error) {
      console.error('Failed to read saved diagnostic cache:', error)
      return null
    }
  })

  const pendingDiagnostic = useMemo(
    () => serverPendingDiagnostic || localDiagnostic,
    [localDiagnostic, serverPendingDiagnostic]
  )

  const pendingDate = formatDiagnosticDate(pendingDiagnostic?.completedAt)

  return (
    <div className="p-8 lg:p-12 max-w-5xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.85fr] gap-8">
        <section className="bg-white rounded-[2.5rem] border border-slate-100 p-10 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Target className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-1">No Child Added Yet</p>
              <h1 className="text-3xl font-black text-slate-900">
                {pendingDiagnostic ? 'Your baseline is ready to save' : 'Take the baseline first'}
              </h1>
            </div>
          </div>
          <p className="text-slate-500 max-w-2xl mb-8">
            {pendingDiagnostic
              ? 'You already completed a diagnostic before adding a child. Add your child now and we will attach that saved baseline to the correct student profile.'
              : 'You do not need to register a child before taking the diagnostic. Complete the baseline first, then add your child afterwards to save the result and attach it to their profile.'}
          </p>

          {pendingDiagnostic ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <div className="rounded-3xl bg-indigo-50 p-6 text-center">
                <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2">Saved Status</p>
                <p className="text-3xl font-black text-indigo-600">{pendingDiagnostic.status}</p>
              </div>
              <div className="rounded-3xl bg-emerald-50 p-6 text-center">
                <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2">Saved Score</p>
                <p className="text-3xl font-black text-emerald-600">{pendingDiagnostic.score} / 20</p>
              </div>
              <div className="sm:col-span-2 rounded-2xl bg-slate-50 border border-slate-100 p-5">
                <p className="font-bold text-slate-900 mb-1">Saved baseline</p>
                <p className="text-sm text-slate-500">
                  {pendingDiagnostic.aiSummary || 'Your latest baseline is waiting to be attached as soon as you add your child.'}
                </p>
                {pendingDate && (
                  <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
                    Completed {pendingDate}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="grid gap-4 mb-8">
              <div className="rounded-2xl bg-slate-50 border border-slate-100 p-5">
                <p className="font-bold text-slate-900 mb-1">Lower friction</p>
                <p className="text-sm text-slate-500">Get the baseline done first instead of filling in profile details up front.</p>
              </div>
              <div className="rounded-2xl bg-slate-50 border border-slate-100 p-5">
                <p className="font-bold text-slate-900 mb-1">Save it afterwards</p>
                <p className="text-sm text-slate-500">Once you add your child, the result can be attached to the student profile and used across the app.</p>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-4">
            <Link
              href={pendingDiagnostic ? '/dashboard/add-student' : '/diagnostic'}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-8 py-4 font-bold text-white hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
            >
              {pendingDiagnostic ? 'Add Child to Save Result' : 'Take Baseline Assessment'}
              <ChevronRight className="h-5 w-5" />
            </Link>
            <Link
              href={pendingDiagnostic ? '/diagnostic' : '/dashboard/add-student'}
              className="inline-flex items-center gap-2 rounded-2xl bg-indigo-50 px-8 py-4 font-bold text-indigo-700 hover:bg-indigo-100 transition-all border border-indigo-100"
            >
              {pendingDiagnostic ? 'Retake Baseline Instead' : 'Add Child First'}
              <ChevronRight className="h-5 w-5" />
            </Link>
          </div>

          <div className="mt-5 flex justify-center sm:justify-start">
            <ReportIssueButton
              category="Diagnostic result issue"
              context={{
                pageLabel: 'Diagnostics No Child State',
                pendingDiagnostic,
              }}
            />
          </div>
        </section>

        <section className="bg-indigo-50 rounded-[2.5rem] p-8 border border-indigo-100">
          <div className="h-12 w-12 rounded-2xl bg-white text-indigo-600 flex items-center justify-center mb-5 shadow-sm">
            <Sparkles className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-black text-slate-900 mb-3">How the save works</h3>
          <p className="text-sm text-slate-600 mb-5">
            {pendingDiagnostic
              ? 'Your completed baseline has already been saved against your account or browser session. Once you add your child, we can attach that stored result to the right student profile.'
              : 'If you take the diagnostic now, we can still hold the result in your session. After you add your child, you will be prompted to attach that baseline to their profile.'}
          </p>
          <div className="rounded-2xl bg-white/70 border border-white px-5 py-4 text-sm text-slate-600">
            {pendingDiagnostic
              ? 'You do not need to retake the diagnostic unless you want a fresh measure. Adding your child is enough to attach the existing result.'
              : 'This keeps the entry friction low while still making sure the baseline ends up on the right student record.'}
          </div>
        </section>
      </div>
    </div>
  )
}
