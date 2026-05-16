import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token') // User ID for simplicity in this version
  const type = searchParams.get('type') // 'weekly' or 'nudges'

  if (!token || !type) {
    return new NextResponse('Invalid request', { status: 400 })
  }

  const supabase = await createClient()
  const column = type === 'weekly' ? 'email_consent_weekly' : 'email_consent_nudges'

  const { error } = await supabase
    .from('profiles')
    .update({ [column]: false })
    .eq('id', token)

  if (error) {
    return new NextResponse('Error updating preferences', { status: 500 })
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Unsubscribed - Ace 11+</title>
      <style>
        body { font-family: -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f8fafc; color: #1e293b; margin: 0; }
        .card { background: white; padding: 40px; border-radius: 24px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); max-width: 400px; text-align: center; }
        h1 { font-size: 24px; font-weight: 800; margin-bottom: 16px; }
        p { color: #64748b; line-height: 1.6; margin-bottom: 24px; }
        .btn { background: #4f46e5; color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: 600; display: inline-block; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>Preferences Updated</h1>
        <p>You have been unsubscribed from our ${type === 'weekly' ? 'weekly progress reports' : 'inactivity nudges'}. You can re-enable these anytime in your account settings.</p>
        <a href="/" class="btn">Back to Ace 11+</a>
      </div>
    </body>
    </html>
  `

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' }
  })
}
