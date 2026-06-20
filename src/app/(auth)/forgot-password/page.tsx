import Link from 'next/link'
import { KeyRound, MailCheck } from 'lucide-react'
import { requestPasswordReset } from '@/app/actions/auth'
import { createClient } from '@/lib/supabase/server'

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string; email?: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { error, message, email } = await searchParams
  const defaultEmail = user?.email || email || ''

  return (
    <div className="flex min-h-screen items-center justify-center bg-indigo-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-3xl bg-white p-10 shadow-xl shadow-indigo-100 ring-1 ring-indigo-50">
        <div>
          <img
            src="/logo.png"
            alt="Ace 11+"
            className="mx-auto h-20 w-20 object-contain rounded-2xl shadow-lg shadow-indigo-200"
          />
          <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-slate-900">
            Reset Your Password
          </h2>
          <p className="mt-2 text-center text-sm text-slate-500">
            Enter your email and we&apos;ll send you a password reset link if an account exists.
          </p>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600 ring-1 ring-red-100">
            {error}
          </div>
        )}

        {message && (
          <div className="rounded-xl bg-indigo-50 p-4 text-sm text-indigo-700 ring-1 ring-indigo-100 flex items-start gap-3">
            <MailCheck className="h-5 w-5 shrink-0 text-indigo-600 mt-0.5" />
            <span>{message}</span>
          </div>
        )}

        <form action={requestPasswordReset} className="mt-8 space-y-6">
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                defaultValue={defaultEmail}
                className="block w-full rounded-xl border-0 py-3 px-4 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm transition-all duration-200"
                placeholder="parent@example.com"
              />
            </div>
          </div>

          <button
            type="submit"
            className="group relative flex w-full justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3 px-4 text-sm font-semibold text-white shadow-md hover:from-indigo-500 hover:to-violet-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all duration-200 transform active:scale-95"
          >
            <KeyRound className="mr-2 h-4 w-4" />
            Send Reset Link
          </button>
        </form>

        <div className="text-center text-sm text-slate-500">
          Remembered it?{' '}
          <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors duration-200">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  )
}
