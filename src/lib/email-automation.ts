import { createClient } from '@/lib/supabase/server'
import { sendEmail } from './resend'
import { generateWeeklyProgressEmail, generateInactivityNudgeEmail, EMAIL_FALLBACKS } from './ai-emails'

export async function processAutomatedEmails() {
  const supabase = await createClient()
  
  // 1. Fetch eligible profiles (consented and due for email)
  // We'll use a 14-day threshold for nudges and 7-day for weekly reports
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('*, children(*)')
    .or('email_consent_weekly.eq.true,email_consent_nudges.eq.true')

  if (profileError) {
    console.error('Error fetching profiles for emails:', profileError)
    return { success: false, error: profileError }
  }

  const results = {
    weeklySent: 0,
    nudgesSent: 0,
    errors: [] as any[]
  }

  const now = new Date()

  for (const profile of profiles) {
    const child = profile.children?.[0]
    if (!child) continue

    // --- CASE A: WEEKLY PROGRESS REPORT ---
    if (profile.email_consent_weekly) {
      const lastSent = profile.last_weekly_report_at ? new Date(profile.last_weekly_report_at) : null
      const daysSinceLast = lastSent ? (now.getTime() - lastSent.getTime()) / (1000 * 60 * 60 * 24) : 999

      if (daysSinceLast >= 7) {
        try {
          const activityData = await getChildProgressData(supabase, child.id)
          let content = await generateWeeklyProgressEmail(child, activityData)
          
          if (!content) {
            content = EMAIL_FALLBACKS.weekly(child.name)
          }

          const unsubLink = `${process.env.NEXT_PUBLIC_SITE_URL}/api/unsubscribe?token=${profile.id}&type=weekly`
          const fullHtml = wrapInTemplate(content, unsubLink)

          await sendEmail({
            to: profile.email,
            subject: `Weekly 11+ Progress Update: ${child.name}`,
            html: fullHtml
          })

          await supabase
            .from('profiles')
            .update({ last_weekly_report_at: now.toISOString() })
            .eq('id', profile.id)

          results.weeklySent++
        } catch (err) {
          results.errors.push({ profile: profile.id, type: 'weekly', error: err })
        }
      }
    }

    // --- CASE B: INACTIVITY NUDGE ---
    if (profile.email_consent_nudges) {
      const lastPractice = child.last_practice_date ? new Date(child.last_practice_date) : null
      const lastNudge = profile.last_inactivity_nudge_at ? new Date(profile.last_inactivity_nudge_at) : null
      
      const daysInactive = lastPractice ? (now.getTime() - lastPractice.getTime()) / (1000 * 60 * 60 * 24) : 999
      const daysSinceLastNudge = lastNudge ? (now.getTime() - lastNudge.getTime()) / (1000 * 60 * 60 * 24) : 999

      // Only nudge if inactive for 14+ days AND haven't nudged in the last 14 days
      if (daysInactive >= 14 && daysSinceLastNudge >= 14) {
        try {
          let content = await generateInactivityNudgeEmail(child.name, Math.floor(daysInactive))
          
          if (!content) {
            content = EMAIL_FALLBACKS.nudge(child.name)
          }

          const unsubLink = `${process.env.NEXT_PUBLIC_SITE_URL}/api/unsubscribe?token=${profile.id}&type=nudges`
          const fullHtml = wrapInTemplate(content, unsubLink)

          await sendEmail({
            to: profile.email,
            subject: `Thinking of ${child.name}'s 11+ journey`,
            html: fullHtml
          })

          await supabase
            .from('profiles')
            .update({ last_inactivity_nudge_at: now.toISOString() })
            .eq('id', profile.id)

          results.nudgesSent++
        } catch (err) {
          results.errors.push({ profile: profile.id, type: 'nudge', error: err })
        }
      }
    }
  }

  return results
}

async function getChildProgressData(supabase: any, childId: string) {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  // 1. Mastery Data
  const { data: mastery } = await supabase
    .from('topic_mastery')
    .select('topic, accuracy')
    .eq('child_id', childId)

  // 2. Recent Attempts
  const { data: attempts } = await supabase
    .from('question_attempts')
    .select('is_correct')
    .eq('child_id', childId)
    .gte('created_at', sevenDaysAgo.toISOString())

  const totalQuestions = attempts?.length || 0
  const avgAccuracy = totalQuestions > 0 
    ? Math.round((attempts?.filter((a: any) => a.is_correct).length || 0) / totalQuestions * 100)
    : 0

  const sortedMastery = [...(mastery || [])].sort((a, b) => b.accuracy - a.accuracy)
  const strengths = sortedMastery.slice(0, 2).map(m => m.topic)
  const weaknesses = sortedMastery.slice(-2).map(m => m.topic)

  return {
    totalQuestions,
    averageAccuracy: avgAccuracy,
    strengths,
    weaknesses
  }
}

function wrapInTemplate(content: string, unsubLink: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #334155; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .logo { margin-bottom: 30px; font-weight: bold; font-size: 24px; color: #4f46e5; }
        .content { background: #ffffff; border-radius: 12px; }
        .footer { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 12px; color: #94a3b8; text-align: center; }
        a { color: #4f46e5; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">Ace 11+</div>
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          <p>You received this email because you're a parent on Ace 11+.</p>
          <p><a href="${unsubLink}">Unsubscribe or change email preferences</a></p>
          <p>&copy; ${new Date().getFullYear()} Ace 11+. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `
}
