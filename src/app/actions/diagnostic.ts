'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { calculateLevel } from '@/lib/gamification'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface TopicResult {
  topic: string
  subject: string
  correct: number
  total: number
}

export async function submitDiagnostic(childId: string, attempts: { questionId: string; isCorrect: boolean; topic: string; subject: string }[]) {
  const supabase = await createClient()

  try {
    // 1. Calculate overall score
    const score = attempts.filter(a => a.isCorrect).length
    
    // 2. Calculate topic breakdown
    const topics: Record<string, TopicResult> = {}
    
    attempts.forEach(attempt => {
      if (!topics[attempt.topic]) {
        topics[attempt.topic] = { 
          topic: attempt.topic, 
          subject: attempt.subject, 
          correct: 0, 
          total: 0 
        }
      }
      topics[attempt.topic].total++
      if (attempt.isCorrect) topics[attempt.topic].correct++
    })

    const topicBreakdown = Object.values(topics).map(t => ({
      topic: t.topic,
      subject: t.subject,
      accuracy: Math.round((t.correct / t.total) * 100)
    }))

    // 3. Handle Guest Mode (No DB Save)
    if (!childId) {
      const prompt = `
        You are an expert 11+ tutor. Analyze these diagnostic results for a prospective student.
        Overall Score: ${score} / ${attempts.length}
        Topic Breakdown: ${JSON.stringify(topicBreakdown)}

        Provide an encouraging, tutor-style review (3-4 sentences). 
        Highlight strengths and suggest why they should join Ace11+ to improve the weaker areas.
      `

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
      })

      const aiSummary = response.choices[0].message.content || ""
      return { success: true, aiSummary, topicBreakdown, score, isGuest: true }
    }

    const { data: child, error: childError } = await supabase
      .from('children')
      .select('name, xp, level, total_points')
      .eq('id', childId)
      .single()

    if (childError || !child) {
      console.error('Child not found during diagnostic submission:', childError)
      return { success: false, error: 'Student profile not found' }
    }

    const prompt = `
      You are an expert 11+ tutor. Analyze the following diagnostic results for a student named ${child?.name || 'the student'}.
      Overall Score: ${score} / ${attempts.length}
      Topic Breakdown: ${JSON.stringify(topicBreakdown)}

      Provide a child-friendly and parent-friendly review (3-4 sentences). 
      - Highlight 1-2 strengths.
      - Identify 1-2 areas for improvement.
      - Sound encouraging and professional.
    `

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    })

    const aiSummary = response.choices[0].message.content || ""

    const { data: diagnostic, error: diagError } = await supabase
      .from('diagnostic_results')
      .insert({
        child_id: childId,
        score: score,
        topic_breakdown: topicBreakdown,
        ai_summary: aiSummary
      })
      .select()
      .single()

    if (diagError) throw new Error(diagError.message)

    for (const topic of topicBreakdown) {
      await supabase.from('topic_mastery').upsert({
        child_id: childId,
        subject: topic.subject,
        topic: topic.topic,
        accuracy: topic.accuracy,
        last_updated: new Date().toISOString()
      }, { onConflict: 'child_id,topic' })
    }

    // 5. Update Child Stats (XP & Leveling)
    const xpGained = score * 50 // Diagnostics are big deals! 50 XP per correct.
    const newXP = (child?.xp || 0) + xpGained
    const newLevel = calculateLevel(newXP)
    const isLevelUp = newLevel > (child?.level || 1)

    await supabase
      .from('children')
      .update({
        total_points: (child?.total_points || 0) + xpGained,
        xp: newXP,
        level: newLevel
      })
      .eq('id', childId)

    revalidatePath('/dashboard')
    revalidatePath('/leaderboard')
    return { 
      success: true, 
      diagnosticId: diagnostic.id, 
      aiSummary, 
      topicBreakdown, 
      score,
      isLevelUp,
      newLevel,
      xpGained
    }
  } catch (error: any) {
    console.error('Diagnostic Submission Error:', error)
    
    // Check for OpenAI quota error specifically
    if (error?.status === 429 || error?.code === 'insufficient_quota') {
      throw new Error('AI Credits Exceeded: We reached our daily limit for AI tutor help. Don\'t worry, your practice scores are saved, but the AI summary is unavailable right now.')
    }

    throw new Error('Failed to save diagnostic results. Please try again.')
  }
}

export async function claimGuestDiagnostic(childId: string, data: { score: number, breakdown: any[], aiSummary: string }) {
  const supabase = await createClient()

  const { data: diagnostic, error: diagError } = await supabase
    .from('diagnostic_results')
    .insert({
      child_id: childId,
      score: data.score,
      topic_breakdown: data.breakdown,
      ai_summary: data.aiSummary
    })
    .select()
    .single()

  if (diagError) throw new Error(diagError.message)

  for (const topic of data.breakdown) {
    await supabase.from('topic_mastery').upsert({
      child_id: childId,
      subject: topic.subject,
      topic: topic.topic,
      accuracy: topic.accuracy,
      last_updated: new Date().toISOString()
    }, { onConflict: 'child_id,topic' })
  }

  revalidatePath('/dashboard')
  return { success: true }
}
