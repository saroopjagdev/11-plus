import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const resend = new Resend(process.env.RESEND_API_KEY || 'no_key_for_build')

  // 1. Security Check (Basic Token check)
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')
  
  if (token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  // 2. Fetch parents in batches who haven't received a report in the last 6 days
  const sixDaysAgo = new Date()
  sixDaysAgo.setDate(sixDaysAgo.getDate() - 6)

  const { data: parents, error: parentsError } = await supabase
    .from('profiles')
    .select('id, email, children (*)')
    .or(`last_report_sent_at.lt.${sixDaysAgo.toISOString()},last_report_sent_at.is.null`)
    .limit(50) // Process in batches to avoid timeouts

  if (parentsError) {
    return NextResponse.json({ error: parentsError.message }, { status: 500 })
  }

  const results = []

  for (const parent of parents) {
    if (!parent.children || parent.children.length === 0) continue

    // Mark as processed immediately to prevent duplicate runs
    await supabase
      .from('profiles')
      .update({ last_report_sent_at: new Date().toISOString() })
      .eq('id', parent.id)

    for (const child of parent.children) {
      // 3. Fetch Weekly Progress
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      
      const { data: recentMastery } = await supabase
        .from('topic_mastery')
        .select('*')
        .eq('child_id', child.id)
        .gte('last_updated', sevenDaysAgo.toISOString())

      const { data: recentSessions } = await supabase
        .from('sessions')
        .select('*')
        .eq('child_id', child.id)
        .gte('completed_at', sevenDaysAgo.toISOString())

      if (recentSessions?.length === 0 && recentMastery?.length === 0) continue

      const xpGained = (recentSessions?.reduce((acc, s) => acc + (s.score * 10), 0) || 0)
      const topicsMastered = recentMastery?.filter(m => m.accuracy >= 85).length || 0
      const averageAccuracy = recentMastery?.length 
        ? Math.round(recentMastery.reduce((acc, m) => acc + m.accuracy, 0) / recentMastery.length)
        : 0

      // 4. Send Email
      try {
        await resend.emails.send({
          from: 'Ace 11+ <reports@ace11plus.org>',
          to: parent.email,
          subject: `Weekly Progress Report for ${child.name}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #334155;">
              <h1 style="color: #4f46e5; font-size: 24px; font-weight: 800;">Weekly Summary: ${child.name}</h1>
              <p style="font-size: 16px; line-height: 1.5;">Here is how ${child.name} performed on Ace 11+ this week.</p>
              
              <div style="background: #f8fafc; border-radius: 16px; padding: 20px; margin: 20px 0;">
                <div style="display: flex; gap: 20px;">
                  <div style="flex: 1; text-align: center;">
                    <p style="font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin: 0;">XP Gained</p>
                    <p style="font-size: 24px; font-weight: 900; color: #4f46e5; margin: 5px 0;">+${xpGained}</p>
                  </div>
                  <div style="flex: 1; text-align: center;">
                    <p style="font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin: 0;">Topics Improved</p>
                    <p style="font-size: 24px; font-weight: 900; color: #10b981; margin: 5px 0;">${topicsMastered}</p>
                  </div>
                  <div style="flex: 1; text-align: center;">
                    <p style="font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin: 0;">Avg. Accuracy</p>
                    <p style="font-size: 24px; font-weight: 900; color: #f59e0b; margin: 5px 0;">${averageAccuracy}%</p>
                  </div>
                </div>
              </div>

              <h2 style="font-size: 18px; font-weight: 700; margin-top: 30px;">What's Next?</h2>
              <p style="font-size: 14px; color: #64748b;">${child.name} is making great progress. Encourage them to keep up their daily streak to stay on track for the 11+ exam!</p>
              
              <a href="https://ace11plus.org/parent/dashboard" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 12px; font-weight: 700; text-decoration: none; margin-top: 20px;">View Full Dashboard</a>
              
              <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 40px 0;" />
              <p style="font-size: 12px; color: #94a3b8; text-align: center;">You are receiving this because you signed up for Ace 11+.<br/>Support: support@ace11plus.org</p>
            </div>
          `
        })
        results.push({ email: parent.email, success: true })
      } catch (err) {
        console.error(`Error sending to ${parent.email}:`, err)
        results.push({ email: parent.email, success: false, error: err })
      }
    }
  }

  return NextResponse.json({ processed: results.length, details: results })
}
