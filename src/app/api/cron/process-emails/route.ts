import { NextResponse } from 'next/server'
import { processAutomatedEmails } from '@/lib/email-automation'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  // Return immediately so cron-job.org doesn't time out waiting.
  // processAutomatedEmails runs in the background via waitUntil.
  const response = NextResponse.json({ success: true, queued: true })

  // @ts-ignore — Next.js exposes waitUntil via the global ExtendableEvent in edge/node runtimes
  if (typeof globalThis.EdgeRuntime !== 'undefined' && (globalThis as any).waitUntil) {
    ;(globalThis as any).waitUntil(processAutomatedEmails())
  } else {
    // Node runtime: fire-and-forget
    processAutomatedEmails().catch((err) => console.error('Cron Error:', err))
  }

  return response
}
