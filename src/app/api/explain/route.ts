import { createClient } from '@/lib/supabase/server'
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

  const { questionId } = await request.json()
  if (!questionId) {
    return NextResponse.json({ error: 'Question ID required' }, { status: 400 })
  }

  try {
    // 2. Check if explanation exists in DB
    const { data: existing, error: fetchError } = await supabase
      .from('explanations')
      .select('*')
      .eq('question_id', questionId)
      .limit(1)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ explanation: existing.explanation_text, cached: true })
    }

    // 3. If not, fetch question details to provide context to AI
    const { data: question, error: qError } = await supabase
      .from('questions')
      .select('*')
      .eq('id', questionId)
      .single()

    if (qError || !question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    // 4. Generate explanation via OpenAI (GPT-4o-mini)
    const prompt = `
      You are a friendly 11+ tutor. Explain this question to a 9-year-old child.
      
      Question: ${question.question_text}
      Options: ${question.options.join(', ')}
      Correct Answer: ${question.correct_answer}
      Subject: ${question.subject}
      Topic: ${question.topic}

      Requirements:
      - Use simple, encouraging language.
      - Keep it short (3-5 clear steps).
      - Explain WHY the correct answer is right.
      - Briefly explain why other options might be confusing (if applicable).
      - Structure it with numbered steps.
    `

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful, encouraging 11+ tutor for children aged 8-10." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 500,
    })

    const explanationContent = completion.choices[0].message.content

    if (!explanationContent) throw new Error('No explanation generated')

    // 5. Store in DB (Note: In the PRD, we store only if marked helpful later, but for MVP caching is good)
    // Actually, PRD says: "if explanation exists -> return. Else: generate -> return. If marked helpful -> store."
    // So for now, I'll just return it. I'll implement the "helpful" save in a separate action.
    
    return NextResponse.json({ explanation: explanationContent, cached: false })
  } catch (error: any) {
    console.error('AI Explanation Error:', error)
    
    // Check for OpenAI quota specifically
    if (error?.status === 429 || error?.code === 'insufficient_quota') {
      return NextResponse.json({ 
        error: 'AI Credits Exceeded', 
        message: 'The daily AI limit for this trial has been reached. Please upgrade to Pro for unlimited tutor help.' 
      }, { status: 429 })
    }

    return NextResponse.json({ error: 'Failed to generate explanation' }, { status: 500 })
  }
}
