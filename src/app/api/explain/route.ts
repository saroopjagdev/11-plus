import { createClient } from '@/lib/supabase/server'
import { hasProAccess } from '@/lib/entitlements'
import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

function buildAnswerReview(learnerAnswer: string | null | undefined, correctAnswer: string) {
  const safeLearnerAnswer = learnerAnswer?.trim()
  if (!safeLearnerAnswer) {
    return `No answer was saved for this attempt. The correct answer is "${correctAnswer}".`
  }

  if (safeLearnerAnswer === correctAnswer) {
    return `You chose "${safeLearnerAnswer}", which is correct.`
  }

  return `You chose "${safeLearnerAnswer}". The correct answer is "${correctAnswer}".`
}

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
        message: 'Upgrade to Pro or start your free trial to unlock unlimited AI tutor explanations.',
      },
      { status: 403 }
    )
  }

  const { questionId, learnerAnswer } = await request.json()
  if (!questionId) {
    return NextResponse.json({ error: 'Question ID required' }, { status: 400 })
  }

  try {
    // 2. Fetch question details to provide context to AI
    const { data: question, error: qError } = await supabase
      .from('questions')
      .select('*, passage:passages(title, content)')
      .eq('id', questionId)
      .single()

    if (qError || !question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    // 3. Check if explanation exists in DB
    const { data: existing } = await supabase
      .from('explanations')
      .select('*')
      .eq('question_id', questionId)
      .limit(1)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({
        explanation: existing.explanation_text,
        answerReview: buildAnswerReview(learnerAnswer, question.correct_answer),
        cached: true,
      })
    }

    // 4. Generate explanation via OpenAI (GPT-4o-mini)
    const prompt = `
      You are a friendly 11+ tutor. Explain this question to a 9-year-old child.
      
      Question: ${question.question_text}
      ${question.options ? `Options: ${question.options.join(', ')}` : 'Type: Written Answer'}
      Correct Answer: ${question.correct_answer}
      Subject: ${question.subject}
      Topic: ${question.topic}
      ${question.passage ? `Passage Title: ${question.passage.title}\nPassage Content: ${question.passage.content}` : ''}

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

    // 5. Cache in DB immediately for speed
    await supabase.from('explanations').insert({
      question_id: questionId,
      explanation_text: explanationContent,
      helpful_count: 0,
      is_verified: false
    })
    
    return NextResponse.json({
      explanation: explanationContent,
      answerReview: buildAnswerReview(learnerAnswer, question.correct_answer),
      cached: false,
    })
  } catch (error: unknown) {
    console.error('AI Explanation Error:', error)
    const openAiError = error as { status?: number; code?: string }
    
    // Check for OpenAI quota specifically
    if (openAiError?.status === 429 || openAiError?.code === 'insufficient_quota') {
      return NextResponse.json({ 
        error: 'Temporary AI limit reached', 
        message: 'We have hit our current AI explanation limit. Please try again shortly.' 
      }, { status: 429 })
    }

    return NextResponse.json(
      {
        error: 'Explanation unavailable',
        message: 'We could not generate an explanation right now. Please try again in a moment.',
      },
      { status: 500 }
    )
  }
}
