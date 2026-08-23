import { NextResponse } from 'next/server'
import { waitUntil } from '@vercel/functions'
import { processAutomatedEmails } from '@/lib/email-automation'

export const dynamic = 'force-dynamic'

// This must run on Vercel's Node runtime (no `export const runtime = 'edge'`
// here), which is exactly why the previous implementation never actually
// sent an email reliably. It checked `globalThis.EdgeRuntime` to decide
// whether background work would keep running after the response was sent —
// but that global is only ever defined under Vercel's Edge runtime, which
// this route has never opted into. So the check was always false, and the
// route always fell into a bare `processAutomatedEmails().catch(...)` with
// nothing keeping the serverless invocation alive: once the response below
// was returned, Vercel was free to freeze the function mid-send.
//
// The evidence in the data: every profile that has ever received a weekly
// report or inactivity nudge shares the exact same timestamp, a single batch
// from 2026-06-24 — not the spread of dates 60+ days of daily cron runs
// should have produced. Vercel's own cron monitor still showed this route
// "succeeding" every day throughout, because the HTTP response returns
// immediately regardless of whether the background send ever completes.
//
// `waitUntil` from `@vercel/functions` is the actually-supported mechanism
// for this on Vercel's Node runtime — it extends the invocation's lifetime
// until the passed promise settles, instead of guessing at a runtime-specific
// global that was never applicable here.
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')

  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  waitUntil(
    processAutomatedEmails().catch((err) => {
      console.error('Cron Error:', err)
    })
  )

  // Return immediately so the calling scheduler doesn't time out waiting —
  // waitUntil (not this response) is what keeps processAutomatedEmails alive.
  return NextResponse.json({ success: true, queued: true })
}
