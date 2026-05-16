import { NextResponse } from 'next/server'
import { processAutomatedEmails } from '@/lib/email-automation'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const results = await processAutomatedEmails()
    return NextResponse.json({
      success: true,
      processed: results
    })
  } catch (error: any) {
    console.error('Cron Error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
