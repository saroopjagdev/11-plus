import Link from 'next/link'
import { MailCheck, ShieldCheck } from 'lucide-react'
import { confirmEmailToken } from '@/app/actions/auth'

// Never cache — this page is per-token and must not be served statically.
export const dynamic = 'force-dynamic'

/**
 * Email-confirmation interstitial.
 *
 * The confirmation email links here with a single-use `token_hash`. We do NOT
 * verify on load: mail security scanners (Microsoft Safe Links, corporate
 * gateways, etc.) prefetch links with GET/HEAD to vet them, and verifying on
 * load lets that automated fetch consume the token before the real user clicks
 * — the exact cause of "link expired the moment I clicked it". Instead we render
 * a button; verification runs only when the human submits the form (a POST),
 * which scanners never do. See `confirmEmailToken` in app/actions/auth.ts.
 */
export default async function ConfirmEmailPage({
  searchParams,
}: {
  searchParams: Promise<{
    token_hash?: string
    type?: string
    code?: string
    next?: string
    email?: string
  }>
}) {
  const { token_hash, type, code, next, email } = await searchParams
  const hasToken = Boolean((token_hash && type) || code)

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-indigo-100 bg-white p-8 shadow-sm text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <MailCheck className="h-7 w-7" />
          </div>

          {hasToken ? (
            <>
              <h1 className="text-2xl font-black text-slate-900 mb-2">Confirm your email</h1>
              <p className="text-sm text-slate-500 mb-6">
                {email ? (
                  <>
                    You&apos;re one tap away from activating{' '}
                    <span className="font-bold text-slate-700">{email}</span>. Click below to
                    finish setting up your account.
                  </>
                ) : (
                  <>You&apos;re one tap away from activating your account. Click below to finish.</>
                )}
              </p>

              <form action={confirmEmailToken}>
                <input type="hidden" name="token_hash" value={token_hash || ''} />
                <input type="hidden" name="type" value={type || ''} />
                <input type="hidden" name="code" value={code || ''} />
                <input type="hidden" name="next" value={next || '/dashboard'} />
                <input type="hidden" name="email" value={email || ''} />
                <button
                  type="submit"
                  className="w-full rounded-xl bg-slate-900 py-4 px-4 text-sm font-bold text-white shadow-xl hover:bg-slate-800 transition-all duration-200 transform active:scale-95"
                >
                  Confirm my email
                </button>
              </form>

              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                Secure one-time confirmation.
              </div>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-black text-slate-900 mb-2">Link incomplete</h1>
              <p className="text-sm text-slate-500 mb-6">
                This confirmation link is missing its verification token. Head back to sign-up to
                request a fresh confirmation email.
              </p>
              <Link
                href="/signup?confirm=1"
                className="inline-block w-full rounded-xl bg-slate-900 py-4 px-4 text-sm font-bold text-white shadow-xl hover:bg-slate-800 transition-all duration-200"
              >
                Back to sign-up
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
