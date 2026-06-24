import { createClient } from '@/lib/supabase/server'
import { hasProAccess } from '@/lib/entitlements'
import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: Request) {
  const supabase = await createClient()

  // 1. Check auth
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_status, lifetime_access')
    .eq('id', user.id)
    .single()

  if (!hasProAccess(profile)) {
    return NextResponse.json(
      {
        error: 'Pro subscription required',
        message: 'Upgrade to Pro or start your free trial to unlock AI grading.',
      },
      { status: 403 }
    )
  }

  const { questionText, studentAnswer, rubric } = await request.json()

  if (!studentAnswer) {
    return NextResponse.json({ error: 'Student answer required' }, { status: 400 })
  }

  try {
    // Generate grade and feedback via OpenAI (GPT-4o-mini)
    const prompt = `
      You are an expert 11+ examiner. Grade the following student's answer based on the provided marking rubric.
      
      Question: ${questionText}
      Student's Answer: ${studentAnswer}
      Marking Rubric: ${rubric}

      Requirements:
      - Be encouraging but strict on the 11+ standards.
      - Provide a score out of 100.
      - Provide a "Tutor Tip" on how to improve the answer.
      - Keep the feedback concise (2-3 sentences).
      
      Output ONLY a JSON object with this format:
      {
        "score": number,
        "feedback": "string"
      }
    `

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful, professional 11+ examiner for children aged 8-10." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    })

    const result = JSON.parse(completion.choices[0].message.content || '{}')

    return NextResponse.json(result)
  } catch (error: unknown) {
    console.error('AI Grading Error:', error)
    return NextResponse.json({ error: 'Failed to grade answer' }, { status: 500 })
  }
}
