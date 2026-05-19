'use server'

import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { getProgressToNextTier } from '@/lib/mastery'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

interface MistakeAttempt {
  selected_answer: string | null
  questions?: {
    question_text?: string | null
    topic?: string | null
    subject?: string | null
  } | null
}

export async function getWeeklyReport(childId: string) {
  const supabase = await createClient()
  
  // Get start of current week (Monday)
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(now.setDate(diff))
  monday.setHours(0, 0, 0, 0)
  const weekStart = monday.toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('weekly_reports')
    .select('*')
    .eq('child_id', childId)
    .eq('week_start_date', weekStart)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching weekly report:', error)
  }

  return data
}

export async function getParentDashboardData(childId: string) {
  const supabase = await createClient()

  // 1. Get Subject Accuracy
  const { data: mastery, error: masteryError } = await supabase
    .from('topic_mastery')
    .select('subject, accuracy, questions_answered, mastery_level')
    .eq('child_id', childId)

  if (masteryError) throw new Error(masteryError.message)
  const safeMastery = mastery || []

  // Aggregate by subject
  const subjectStats: Record<string, { totalProgress: number, count: number }> = {}
  safeMastery.forEach(m => {
    if (!subjectStats[m.subject]) {
      subjectStats[m.subject] = { totalProgress: 0, count: 0 }
    }
    subjectStats[m.subject].totalProgress += getProgressToNextTier(m)
    subjectStats[m.subject].count += 1
  })

  const aggregatedStats = Object.entries(subjectStats).map(([subject, stats]) => ({
    subject,
    progress: Math.round(stats.totalProgress / stats.count)
  }))

  // 2. Get Recent Activity
  const { data: sessions, error: sessionError } = await supabase
    .from('sessions')
    .select('*')
    .eq('child_id', childId)
    .order('completed_at', { ascending: false })
    .limit(5)

  if (sessionError) throw new Error(sessionError.message)

  return {
    subjectStats: aggregatedStats,
    recentSessions: sessions || []
  }
}

export async function generateWeeklyReport(childId: string) {
  const supabase = await createClient()

  // 1. Get last 7 days of incorrect attempts
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { data: attempts, error: attemptsError } = await supabase
    .from('question_attempts')
    .select(`
      *,
      questions:question_id (
        question_text,
        topic,
        subject
      )
    `)
    .eq('child_id', childId)
    .eq('is_correct', false)
    .gte('created_at', sevenDaysAgo.toISOString())

  if (attemptsError) throw new Error(attemptsError.message)

  if (!attempts || attempts.length === 0) {
    return { success: false, message: 'Not enough data to generate a report yet. Encourage your child to practice!' }
  }

  // 2. Format for AI
  const errorData = attempts.map((a: MistakeAttempt) => ({
    topic: a.questions?.topic,
    subject: a.questions?.subject,
    question: a.questions?.question_text,
    answerProvided: a.selected_answer
  }))

  // 3. Call OpenAI
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are an expert 11+ tutor analyzing a student's mistakes for their parent. 
        Summarize recurring themes in their errors ('Exam Traps'). Be supportive but honest.
        
        STRICT FORMATTING RULES:
        1. DO NOT use markdown bolding (e.g., no **text**).
        2. Use the following structure:
           ### Overview of Student's Performance
           [A brief 2-3 sentence high-level summary]
           
           ### 1. [Subject Name or Theme]
           - [Category Name (without bolding)]: [Analysis]
           
           ### Recommendations
           1. [Recommendation 1]
           ...
           
        Keep it professional and insightful for a parent. Focus on patterns like rushing, logic gaps, or vocabulary depth.`
      },
      {
        role: "user",
        content: `Analyze these 11+ mistakes: ${JSON.stringify(errorData)}`
      }
    ]
  })

  const aiSummary = response.choices[0].message.content

  // 4. Save to DB
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(now.setDate(diff))
  monday.setHours(0, 0, 0, 0)
  const weekStart = monday.toISOString().split('T')[0]

  const { data: savedReport, error: saveError } = await supabase
    .from('weekly_reports')
    .insert({
      child_id: childId,
      week_start_date: weekStart,
      ai_summary: aiSummary
    })
    .select()
    .single()

  if (saveError) {
     if (saveError.code === '23505') { // Unique constraint
       return { success: true, aiSummary, message: 'A report already exists for this week.' }
     }
     throw new Error(saveError.message)
  }

  return { success: true, aiSummary: savedReport.ai_summary }
}
