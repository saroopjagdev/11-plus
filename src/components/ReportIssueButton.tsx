'use client'

import React, { useMemo, useState, useTransition } from 'react'
import { AlertTriangle, Loader2, MessageSquareWarning, X } from 'lucide-react'
import { submitIssueReport } from '@/app/actions/issue-reports'
import { IssueReportCategory, IssueReportContext, ISSUE_REPORT_CATEGORIES } from '@/lib/issue-reporting'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface ReportIssueButtonProps {
  label?: string
  category?: IssueReportCategory
  userEmail?: string | null
  childId?: string | null
  sessionId?: string | null
  questionId?: string | null
  diagnosticId?: string | null
  context?: IssueReportContext
  variant?: 'link' | 'ghost'
  className?: string
}

export function ReportIssueButton({
  label = 'Report a problem',
  category = 'Something failed',
  userEmail,
  childId,
  sessionId,
  questionId,
  diagnosticId,
  context,
  variant = 'link',
  className,
}: ReportIssueButtonProps) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<IssueReportCategory>(category)
  const [message, setMessage] = useState('')
  const [guestEmail, setGuestEmail] = useState(userEmail || '')
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [isPending, startTransition] = useTransition()

  const mergedContext = useMemo<IssueReportContext>(
    () => ({
      ...(context || {}),
      pagePath: pathname,
      browserTimestamp: new Date().toISOString(),
    }),
    [context, pathname]
  )

  const openModal = () => {
    setSelectedCategory(category)
    setGuestEmail(userEmail || '')
    setMessage('')
    setError(null)
    setSubmitted(false)
    setIsOpen(true)
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    startTransition(async () => {
      const result = await submitIssueReport({
        category: selectedCategory,
        message,
        reporterEmail: userEmail ? null : guestEmail,
        childId,
        sessionId,
        questionId,
        diagnosticId,
        pagePath: pathname,
        context: mergedContext,
      })

      if (!result.success) {
        setError(result.error || 'We could not submit your report.')
        return
      }

      setSubmitted(true)
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className={cn(
          variant === 'ghost'
            ? 'inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:border-slate-300 hover:text-slate-900'
            : 'inline-flex items-center gap-2 text-xs font-bold text-slate-400 underline underline-offset-4 hover:text-slate-600',
          className
        )}
      >
        <MessageSquareWarning className="h-4 w-4" />
        {label}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[2rem] border border-slate-100 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900">Report a problem</p>
                  <p className="text-xs font-medium text-slate-500">Help us investigate what went wrong.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-6">
              {submitted ? (
                <div className="space-y-4 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                    <MessageSquareWarning className="h-7 w-7" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900">Thanks, we&apos;ve got it</h3>
                  <p className="text-sm text-slate-500">
                    Your report has been sent to the team with the relevant page context.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="mt-2 inline-flex items-center justify-center rounded-2xl bg-slate-900 px-6 py-3 text-sm font-bold text-white hover:bg-slate-800"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">
                      Category
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value as IssueReportCategory)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none focus:border-indigo-400"
                    >
                      {ISSUE_REPORT_CATEGORIES.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  {!userEmail && (
                    <div>
                      <label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">
                        Your email
                      </label>
                      <input
                        type="email"
                        required
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none focus:border-indigo-400"
                        placeholder="parent@email.com"
                      />
                    </div>
                  )}

                  {userEmail && (
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Contact</p>
                      <p className="text-sm font-medium text-slate-700">{userEmail}</p>
                    </div>
                  )}

                  <div>
                    <label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">
                      What happened?
                    </label>
                    <textarea
                      required
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={5}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none focus:border-indigo-400"
                      placeholder="Tell us what looked wrong, what you expected, or what failed."
                    />
                  </div>

                  {error && <p className="text-sm font-bold text-rose-500">{error}</p>}

                  <div className="flex items-center justify-between gap-3 pt-2">
                    <p className="text-[11px] text-slate-400">
                      We&apos;ll attach the page and feature context automatically.
                    </p>
                    <button
                      type="submit"
                      disabled={isPending}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-60"
                    >
                      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      Submit report
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
