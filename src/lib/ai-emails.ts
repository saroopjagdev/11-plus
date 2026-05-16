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

export const EMAIL_FALLBACKS = {
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
