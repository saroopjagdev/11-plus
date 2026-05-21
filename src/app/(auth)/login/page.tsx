import { createClient } from '@/lib/supabase/server'
import { login, resendEmail } from '@/app/actions/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string, message?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    redirect('/dashboard')
  }

  const { error, message } = await searchParams;
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
            Welcome Back!
          </h2>
          <p className="mt-2 text-center text-sm text-slate-500">
            Log in to continue your practice.
          </p>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600 ring-1 ring-red-100">
            {error}
          </div>
        )}

        {message && (
          <div className="rounded-xl bg-indigo-50 p-4 text-sm text-indigo-600 ring-1 ring-indigo-100">
            {message}
          </div>
        )}

        <form action={login} className="mt-8 space-y-6">
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
                className="block w-full rounded-xl border-0 py-3 px-4 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm transition-all duration-200"
                placeholder="parent@example.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="block w-full rounded-xl border-0 py-3 px-4 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm transition-all duration-200"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-700">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <a href="#" className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors duration-200">
                Forgot password?
              </a>
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative flex w-full justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3 px-4 text-sm font-semibold text-white shadow-md hover:from-indigo-500 hover:to-violet-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all duration-200 transform active:scale-95"
            >
              Sign In
            </button>
          </div>
        </form>

        <p className="mt-2 text-center text-sm text-slate-500">
          Not registered yet?{' '}
          <Link href="/signup" className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors duration-200">
            Create an account
          </Link>
        </p>

        <details className="mt-4 group">
          <summary className="text-center text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 cursor-pointer list-none transition-colors">
            Didn&apos;t receive a confirmation email?
          </summary>
          <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-[10px] text-slate-500 mb-3 font-medium">Enter your email and we&apos;ll send a fresh link.</p>
            <form action={resendEmail} className="flex flex-col gap-2">
              <input 
                type="email" 
                name="email" 
                placeholder="parent@example.com" 
                className="bg-white px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/20"
                required
              />
              <button 
                type="submit"
                className="py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all active:scale-95"
              >
                Resend Link
              </button>
            </form>
          </div>
        </details>
      </div>
    </div>
  )
}
