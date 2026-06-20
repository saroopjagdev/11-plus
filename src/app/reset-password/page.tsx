'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Loader2, LockKeyhole, MailCheck } from 'lucide-react'
import { type EmailOtpType } from '@supabase/supabase-js'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type ResetState = 'loading' | 'ready' | 'error' | 'success'

const MIN_PASSWORD_LENGTH = 8

function ResetPasswordContent() {
  const searchParams = useSearchParams()
  const supabase = useMemo(() => createClient(), [])

  const [state, setState] = useState<ResetState>('loading')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const recoverSession = async () => {
      try {
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')

        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })

          if (sessionError) {
            setError('This password reset link is invalid or has expired. Please request a new one.')
            setState('error')
            return
          }

          setState('ready')
          return
        }

        const tokenHash = searchParams.get('token_hash')
        const type = searchParams.get('type') as EmailOtpType | null

        if (tokenHash && type === 'recovery') {
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type,
          })

          if (verifyError) {
            setError('This password reset link is invalid or has expired. Please request a new one.')
            setState('error')
            return
          }

          setState('ready')
          return
        }

        setError('This password reset link is invalid or has expired. Please request a new one.')
        setState('error')
      } catch {
        setError('This password reset link is invalid or has expired. Please request a new one.')
        setState('error')
      }
    }

    void recoverSession()
  }, [searchParams, supabase.auth])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (!password || !confirmPassword) {
      setError('Please enter and confirm your new password.')
      return
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Your new password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
      return
    }

    if (password !== confirmPassword) {
      setError('Your password confirmation does not match.')
      return
    }

    setIsSubmitting(true)

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    })

    if (updateError) {
      setError(updateError.message || 'We could not update your password. Please request a new reset link.')
      setIsSubmitting(false)
      return
    }

    await supabase.auth.signOut()
    setState('success')
    setIsSubmitting(false)
    window.location.replace('/login?message=' + encodeURIComponent('Your password has been reset. Please sign in.'))
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-xl">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
          {state === 'success' ? <MailCheck className="h-7 w-7" /> : <LockKeyhole className="h-7 w-7" />}
        </div>

        {state === 'loading' && (
          <>
            <h1 className="text-2xl font-black text-slate-900">Preparing password reset</h1>
            <p className="mt-3 text-sm text-slate-500">
              We&apos;re verifying your reset link now.
            </p>
            <div className="mt-6 flex items-center justify-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
              Please wait a moment...
            </div>
          </>
        )}

        {state === 'error' && (
          <>
            <h1 className="text-2xl font-black text-slate-900">Reset link unavailable</h1>
            <p className="mt-3 text-sm text-rose-600">
              {error}
            </p>
            <div className="mt-6">
              <Link
                href="/forgot-password"
                className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-6 py-3 text-sm font-bold text-white hover:bg-slate-800 transition-all"
              >
                Request a new reset link
              </Link>
            </div>
          </>
        )}

        {state === 'ready' && (
          <>
            <h1 className="text-2xl font-black text-slate-900">Choose a new password</h1>
            <p className="mt-3 text-sm text-slate-500">
              Set a new password for your Ace 11+ account.
            </p>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-left">
              <div>
                <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
                  New password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="block w-full rounded-xl border-0 py-3 px-4 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm transition-all duration-200"
                  placeholder="At least 8 characters"
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-slate-700">
                  Confirm new password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="block w-full rounded-xl border-0 py-3 px-4 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm transition-all duration-200"
                  placeholder="Repeat your new password"
                />
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600 ring-1 ring-red-100">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative flex w-full justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3 px-4 text-sm font-semibold text-white shadow-md hover:from-indigo-500 hover:to-violet-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all duration-200 transform active:scale-95 disabled:opacity-70"
              >
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save new password
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
          <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <LockKeyhole className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-black text-slate-900">Preparing password reset</h1>
            <p className="mt-3 text-sm text-slate-500">
              We&apos;re loading your reset session now.
            </p>
            <div className="mt-6 flex items-center justify-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
              Please wait a moment...
            </div>
          </div>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  )
}
