'use server'

import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function evaluateWrittenAnswer(questionText: string, expectedAnswer: string, studentAnswer: string) {
  try {
    const prompt = `
      You are a strict and expert UK 11+ exam marker (GL, CEM, CSSE boards). You are evaluating a student's written response.
      
      Question: "${questionText}"
      Expected Answer / Rubric: "${expectedAnswer}"
      Student's Answer: "${studentAnswer}"

      Tasks:
      1. Determine the maximum marks this question is worth (usually 1, 2, or 3 based on the rubric complexity).
      2. Award a score (0 to maxMarks) based on how many key points the student hit from the rubric.
      3. Be fair: If they got some points right but missed others, award partial marks.
      
      Criteria:
      - Precision: Vague answers lose marks.
      - Evidence (Comprehension): Did they use evidence from the text if required?
      
      Respond in JSON format with exactly three fields:
      - "score": number (the marks awarded)
      - "maxMarks": number (the total marks possible for this question)
      - "feedback": string (A concise, actionable tutor tip. Mention what points they secured and what's missing to get full marks.)
    `

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    })

    const result = JSON.parse(response.choices[0].message.content || '{"score": 0, "maxMarks": 1, "feedback": "Evaluation failed."}')
    return { success: true, score: result.score, maxMarks: result.maxMarks, feedback: result.feedback }

  } catch (error: any) {
    console.error('AI Evaluation Error:', error)
    return { success: false, isCorrect: false, feedback: "We couldn't evaluate your answer right now due to a system error. Keep practicing!" }
  }
}
