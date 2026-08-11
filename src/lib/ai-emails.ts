import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function generateWeeklyProgressEmail(childData: any, activityData: any) {
  const prompt = `
    You are an encouraging and professional 11+ tutor. Write a weekly progress update email for a parent.
    
    Student Name: ${childData.name}
    Current Level: ${childData.level}
    Total XP: ${childData.xp}
    Current Streak: ${childData.current_streak}
    
    Weekly Stats:
    - Questions Answered: ${activityData.totalQuestions}
    - Overall Accuracy: ${activityData.averageAccuracy}%
    - Strong Topics: ${activityData.strengths.join(', ')}
    - Weak Topics: ${activityData.weaknesses.join(', ')}
    
    STRICT REQUIREMENTS:
    1. Output MUST be clean HTML (paragraphs <p>, lists <ul><li>, etc.).
    2. DO NOT use markdown symbols like **bold**, ### headings, or \`code\`.
    3. Use UK English.
    4. Tone: concise, friendly, reassuring.
    5. No formal letter headers (e.g., "Dear Parent"). Just jump into the content.
    6. Suggest 1 specific "Next Step" based on the weak topics.
    7. No raw JSON or malformed formatting.
  `

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: prompt }]
    })

    return response.choices[0].message.content
  } catch (error) {
    console.error('AI Email Generation Failed:', error)
    return null // Fallback will be handled by the caller
  }
}

export async function generateInactivityNudgeEmail(childName: string, daysInactive: number) {
  const prompt = `
    Write a gentle, friendly nudge email for a parent whose child has not practiced for ${daysInactive} days.
    
    Student Name: ${childName}
    
    STRICT REQUIREMENTS:
    1. Output MUST be clean HTML.
    2. No markdown symbols (** or ###).
    3. Use UK English.
    4. Tone: supportive, NOT pushy or clinical.
    5. Keep it very short (2-3 sentences).
    6. No formal letter headers.
  `

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: prompt }]
    })

    return response.choices[0].message.content
  } catch (error) {
    console.error('AI Nudge Generation Failed:', error)
    return null
  }
}

// Welcome and setup-nudge copy is deliberately NOT AI-generated, unlike the
// weekly report and inactivity nudge above.
//
// The welcome email fires inside the email-confirmation redirect, so an
// OpenAI round trip would add seconds to a path the user is actively waiting
// on, plus a failure mode — for a message that is identical for everybody.
// The setup nudge has no child name to personalise with (that is precisely
// why it is being sent), so there is nothing for a model to work with either.
export const EMAIL_FALLBACKS = {
  welcome: () => `
    <p>Hi there,</p>
    <p>Welcome to Ace 11+ — your account is confirmed and ready to go.</p>
    <p>Your next step is to tell us a little about your child so we can tailor their practice. It takes about thirty seconds, and you'll be taken straight through it when you open your dashboard.</p>
    <p>From there you'll get adaptive practice across GL, CEM and ISEB-style questions, plus progress tracking that shows exactly which topics need work.</p>
    <p><a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.ace11plus.org'}/dashboard">Open your dashboard</a></p>
  `,
  setup: () => `
    <p>Hi there,</p>
    <p>You created an Ace 11+ account, but haven't set up your child's profile yet — so there's nothing for us to tailor practice around just yet.</p>
    <p>It's a quick step: add their first name and school year, and their personalised dashboard, practice and progress tracking all switch on straight away.</p>
    <p><a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.ace11plus.org'}/dashboard">Finish setting up</a></p>
  `,
  weekly: (name: string) => `
    <p>Hi there,</p>
    <p>Here is your weekly update for ${name}. They are making steady progress on their 11+ journey!</p>
    <p>Check the dashboard for their latest scores and topic breakdowns.</p>
    <p>Keep up the great work!</p>
  `,
  nudge: (name: string) => `
    <p>Hi there,</p>
    <p>We noticed ${name} hasn't jumped into Ace 11+ for a couple of weeks. Consistency is key for 11+ success!</p>
    <p>Maybe today is a good day for a quick 10-minute practice session?</p>
  `
}
