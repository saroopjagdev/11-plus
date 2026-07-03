'use server'

import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface WrittenAnswerEvaluation {
  success: boolean
  score: number
  maxMarks: number
  feedback: string
}

export async function evaluateWrittenAnswer(
  questionText: string,
  expectedAnswer: string,
  studentAnswer: string,
  maxMarks: number = 3
) {
  const safeMaxMarks = Number.isFinite(maxMarks) && maxMarks > 0 ? Math.round(maxMarks) : 3

  try {
    const prompt = `
      You are a strict and expert UK 11+ exam marker (GL, CEM, CSSE boards). You are evaluating a student's written response against a fixed rubric.

      Question: "${questionText}"
      Marking rubric (this question is worth exactly ${safeMaxMarks} mark${safeMaxMarks === 1 ? '' : 's'} — do not change this total): "${expectedAnswer}"
      Student's Answer: "${studentAnswer}"

      Tasks:
      1. Award a score from 0 to ${safeMaxMarks} based on how many of the rubric's criteria the student's answer satisfies.
      2. Award partial marks fairly — do not require exact wording, only the substance of each rubric point.
      3. Do not award marks for content the rubric does not ask for, and do not invent criteria beyond the rubric.

      Criteria:
      - Precision: vague answers that don't address a specific rubric point lose that point's mark.
      - Evidence (Comprehension): if the rubric requires evidence from the passage, an answer without it cannot earn that point.

      Respond in JSON format with exactly two fields:
      - "score": number (0 to ${safeMaxMarks}, the marks awarded)
      - "feedback": string (a concise, actionable tutor tip — mention what points they secured and what's missing to get full marks)
    `

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    })

    const result = JSON.parse(response.choices[0].message.content || '{"score": 0, "feedback": "Evaluation failed."}')
    const safeScore = Number.isFinite(result.score) ? Number(result.score) : 0

    return {
      success: true,
      score: Math.min(safeMaxMarks, Math.max(0, safeScore)),
      maxMarks: safeMaxMarks,
      feedback: typeof result.feedback === 'string' ? result.feedback : 'Keep practicing and aim for a more complete answer.',
    } satisfies WrittenAnswerEvaluation

  } catch (error: unknown) {
    console.error('AI Evaluation Error:', error)
    return {
      success: false,
      score: 0,
      maxMarks: safeMaxMarks,
      feedback: "We couldn't evaluate your answer right now due to a temporary system issue. Keep practicing and try again in a moment!",
    } satisfies WrittenAnswerEvaluation
  }
}
