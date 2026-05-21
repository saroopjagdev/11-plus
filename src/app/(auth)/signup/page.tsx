import Link from 'next/link'
import { resendEmail, signup } from '@/app/actions/auth'
import { CheckCircle2, MailCheck, ShieldCheck, Target, TrendingUp, Sparkles } from 'lucide-react'

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string
    ref?: string
    email?: string
    guest_diag?: string
    lead?: string
    confirm?: string
    message?: string
    existing?: string
    rate_limited?: string
  }>
}) {
  const { error, ref, email, guest_diag, lead, confirm, message, existing, rate_limited } = await searchParams
  const showConfirmState = confirm === '1'
  const hasKnownEmail = Boolean(email)
  const isExistingPending = existing === '1'
  const isRateLimited = rate_limited === '1'

  return (
    <div className="flex min-h-screen bg-slate-50">
      <div className="hidden lg:flex w-1/2 bg-indigo-600 flex-col justify-between p-12 text-white relative overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500 rounded-full blur-3xl opacity-50" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-violet-500 rounded-full blur-3xl opacity-50" />

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3 mb-20 inline-flex">
            <img
              src="/logo.png"
              alt="Ace 11+"
              className="h-12 w-12 object-contain rounded-xl shadow-lg bg-white p-1"
            />
            <span className="font-bold text-2xl tracking-tight">Ace 11+</span>
          </Link>

          <h2 className="text-4xl font-black mb-8 leading-tight">
            Give your child the <br /> grammar school advantage.
          </h2>

          <div className="space-y-6">
            <div className="flex gap-4 items-start">
              <Target className="h-6 w-6 text-indigo-300 shrink-0 mt-1" />
              <div>
                <h4 className="font-bold text-lg">Adaptive Practice</h4>
                <p className="text-indigo-200 text-sm">Our platform adapts to your child&apos;s skill level, focusing on areas that need the most improvement.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <TrendingUp className="h-6 w-6 text-indigo-300 shrink-0 mt-1" />
              <div>
                <h4 className="font-bold text-lg">Real-Time Analytics</h4>
                <p className="text-indigo-200 text-sm">Track progress across GL, CEM, and ISEB curriculum with detailed parental insights.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <ShieldCheck className="h-6 w-6 text-indigo-300 shrink-0 mt-1" />
              <div>
                <h4 className="font-bold text-lg">Safe & Focused</h4>
                <p className="text-indigo-200 text-sm">A distraction-free environment designed specifically for Year 4 and Year 5 students.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <div className="flex -space-x-2 mb-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-8 w-8 rounded-full bg-indigo-400 border-2 border-indigo-600 flex items-center justify-center text-xs font-bold">
                {String.fromCharCode(64 + i)}
              </div>
            ))}
          </div>
          <p className="text-sm font-medium text-indigo-200">Trusted by hundreds of parents preparing for the 11+.</p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden mb-8 text-center">
            <Link href="/" className="inline-block">
              <img src="/logo.png" alt="Ace 11+" className="h-16 w-16 object-contain rounded-2xl shadow-lg mx-auto mb-4" />
            </Link>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
              {showConfirmState ? 'Confirm Your Email' : 'Join Ace 11+'}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              {showConfirmState ? 'One quick step left before we unlock your account.' : 'The premium preparation platform for Years 4 & 5.'}
            </p>
          </div>

          <div className="hidden lg:block">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
              {showConfirmState ? 'Confirm Your Email' : 'Create Parent Account'}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              {showConfirmState ? 'One quick step left before we unlock the full report.' : 'Start your journey to 11+ success today.'}
            </p>
          </div>

          {guest_diag && (
            <div className="rounded-xl bg-indigo-50 p-4 text-sm text-indigo-700 ring-1 ring-indigo-100 flex items-start gap-3 mb-6">
              <Sparkles className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5 animate-pulse" />
              <div>
                <p className="font-bold">Baseline Results Found!</p>
                <p className="text-indigo-600/80 text-xs mt-1">Create your parent account to claim your score and view your custom learning roadmap.</p>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600 ring-1 ring-red-100 flex items-center gap-3">
              <div className="h-2 w-2 bg-red-600 rounded-full animate-pulse" />
              {error}
            </div>
          )}

          {message && (
            <div className="rounded-xl bg-indigo-50 p-4 text-sm text-indigo-700 ring-1 ring-indigo-100 flex items-center gap-3">
              <MailCheck className="h-5 w-5 text-indigo-600 shrink-0" />
              {message}
            </div>
          )}

          {showConfirmState ? (
            <div className="mt-8 space-y-6">
              <div className="rounded-3xl border border-indigo-100 bg-white p-6 shadow-sm">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                  <MailCheck className="h-7 w-7" />
                </div>
                <h3 className="text-center text-xl font-black text-slate-900 mb-2">
                  {isExistingPending ? 'Finish confirming your account' : 'Check your inbox'}
                </h3>
                <p className="text-center text-sm text-slate-500 mb-5">
                  {hasKnownEmail ? (
                    <>
                      {isExistingPending ? (
                        <>
                          <span className="font-bold text-slate-700">{email}</span> is already registered and still waiting for email confirmation. Use the latest email in your inbox, or request one fresh confirmation link below.
                        </>
                      ) : (
                        <>
                          We&apos;ve sent a confirmation link to <span className="font-bold text-slate-700">{email}</span>. Confirm your email to unlock your account and continue.
                        </>
                      )}
                    </>
                  ) : (
                    <>Your confirmation link could not be completed. Enter your email below and we&apos;ll send you a fresh one.</>
                  )}
                </p>
                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-xs text-slate-500 text-center">
                  {isRateLimited
                    ? 'We recently sent a confirmation email. Please wait a few minutes before requesting another.'
                    : 'Once you&apos;ve confirmed, return here and sign in with the same email and password.'}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Didn&apos;t get the email?</p>
                <form action={resendEmail} className="space-y-3">
                  <input type="hidden" name="returnTo" value="signup" />
                  <input type="hidden" name="guestDiag" value={guest_diag || ''} />
                  {hasKnownEmail ? (
                    <>
                      <input type="hidden" name="email" value={email || ''} />
                      <div className="rounded-xl bg-white px-4 py-3 text-sm text-slate-700 border border-slate-200">
                        {email}
                      </div>
                    </>
                  ) : (
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder="parent@example.com"
                      className="block w-full rounded-xl border-0 py-3.5 px-4 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm transition-all duration-200 bg-white"
                    />
                  )}
                  <button
                    type="submit"
                    className="w-full rounded-xl bg-slate-900 py-3 px-4 text-sm font-bold text-white shadow-lg hover:bg-slate-800 transition-all duration-200 transform active:scale-95"
                  >
                    {isRateLimited ? 'Try Resending Again Soon' : 'Resend Confirmation Email'}
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <form action={signup} className="mt-8 space-y-6">
              <input type="hidden" name="referralCode" defaultValue={ref} />
              <input type="hidden" name="leadId" defaultValue={lead} />
              <input type="hidden" name="guestDiag" defaultValue={guest_diag || ''} />
              <div className="space-y-5 rounded-md">
                <div>
                  <label htmlFor="email" className="block text-sm font-bold text-slate-700 mb-1.5">
                    Parent Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    defaultValue={email || ''}
                    className="block w-full rounded-xl border-0 py-3.5 px-4 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm transition-all duration-200"
                    placeholder="parent@example.com"
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-bold text-slate-700 mb-1.5">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    className="block w-full rounded-xl border-0 py-3.5 px-4 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm transition-all duration-200"
                    placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="group relative flex w-full justify-center rounded-xl bg-slate-900 py-4 px-4 text-sm font-bold text-white shadow-xl hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 transition-all duration-200 transform active:scale-95"
                >
                  Create Account
                </button>
              </div>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link href="/login" className="font-bold text-indigo-600 hover:text-indigo-500 transition-colors duration-200">
              Sign in instead
            </Link>
          </p>

          <div className="mt-10 flex items-center justify-center gap-2 text-xs text-slate-400">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            No credit card required for signup.
          </div>
        </div>
      </div>
    </div>
  )
}
