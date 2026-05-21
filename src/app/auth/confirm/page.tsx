'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { type EmailOtpType } from '@supabase/supabase-js'
import { Loader2, MailCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

function buildSignupRedirect(email: string | null, error: string) {
  const params = new URLSearchParams({
    confirm: '1',
    error,
  })

  if (email) {
    params.set('email', email)
  }

  return `/signup?${params.toString()}`
}

export default function ConfirmEmailPage() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const supabase = createClient()
    const next = searchParams.get('next') ?? '/dashboard'
    const email = searchParams.get('email')

    const fail = (message: string) => {
      window.location.replace(buildSignupRedirect(email, message))
    }

    const completeConfirmation = async () => {
      try {
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })

          if (error) {
            fail('This confirmation link is invalid or has expired. Please request a new one.')
            return
          }

          window.location.replace(next)
          return
        }

        const tokenHash = searchParams.get('token_hash')
        const type = searchParams.get('type') as EmailOtpType | null

        if (tokenHash && type) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type,
          })

          if (error) {
            fail('This confirmation link is invalid or has expired. Please request a new one.')
            return
          }

          window.location.replace(next)
          return
        }

        const { data, error } = await supabase.auth.getSession()

        if (!error && data.session) {
          window.location.replace(next)
          return
        }

        fail('This confirmation link is invalid or has expired. Please request a new one.')
      } catch {
        fail('This confirmation link is invalid or has expired. Please request a new one.')
      }
    }

    void completeConfirmation()
  }, [searchParams])

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-xl">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
          <MailCheck className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-black text-slate-900">Confirming your email</h1>
        <p className="mt-3 text-sm text-slate-500">
          We&apos;re verifying your account and signing you in now.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
          Please wait a moment...
        </div>
      </div>
    </div>
  )
}
