'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { calculateLevel } from '@/lib/gamification'

interface SessionResult {
  childId: string
  score: number
  topic: string
  subject: string
  attempts: {
    questionId: string
    selectedAnswer: string | null
    isCorrect: boolean
    timeTakenSeconds?: number
  }[]
  type?: 'practice' | 'diagnostic' | 'mock'
}

export async function logPracticeSession({ childId, score, topic, subject, attempts, type = 'practice' }: SessionResult) {
  const supabase = await createClient()

  // 1. Create the Session
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .insert({
      child_id: childId,
      score: score,
      type: type,
      completed_at: new Date().toISOString()
    })
    .select()
    .single()

  if (sessionError) {
    console.error('Session Insert Error:', sessionError)
    throw new Error(sessionError.message)
  }

  // 2. Log Individual Attempts
  const attemptsToInsert = attempts.map(attempt => ({
    session_id: session?.id || '', 
    child_id: childId,
    question_id: attempt.questionId,
    selected_answer: attempt.selectedAnswer,
    is_correct: attempt.isCorrect,
    time_taken_seconds: attempt.timeTakenSeconds || 0
  }))

  const { error: attemptsError } = await supabase
    .from('question_attempts')
    .insert(attemptsToInsert)

  if (attemptsError) console.error('Error logging attempts:', attemptsError)

  // 3. Update Topic Mastery
  const correctCount = attempts.filter(a => a.isCorrect).length
  const totalCount = attempts.length
  const sessionAccuracy = (correctCount / totalCount) * 100

  const { data: existingMastery } = await supabase
    .from('topic_mastery')
    .select('*')
    .eq('child_id', childId)
    .eq('topic', topic)
    .maybeSingle()

  if (existingMastery) {
    const newTotalQuestions = existingMastery.questions_answered + totalCount
    
    // Use an Exponential Moving Average (EMA) to heavily weight recent sessions.
    const weight = Math.min(totalCount / 50, 0.5) 
    const newAccuracy = (sessionAccuracy * weight) + (existingMastery.accuracy * (1 - weight))
    const hasMastered = existingMastery.has_ever_mastered || newAccuracy >= 85
    
    await supabase
      .from('topic_mastery')
      .update({
        accuracy: Math.round(newAccuracy),
        has_ever_mastered: hasMastered,
        questions_answered: newTotalQuestions,
        last_updated: new Date().toISOString()
      })
      .eq('id', existingMastery.id)
  } else {
    await supabase
      .from('topic_mastery')
      .insert({
        child_id: childId,
        subject,
        topic,
        accuracy: Math.round(sessionAccuracy),
        has_ever_mastered: sessionAccuracy >= 85,
        questions_answered: totalCount,
        last_updated: new Date().toISOString()
      })
  }

  // 4. Update Child Stats (Streak & Points)
  const { data: child, error: childError } = await supabase
    .from('children')
    .select('total_points, xp, level, current_streak, last_practice_date')
    .eq('id', childId)
    .single()

  if (childError || !child) {
    console.error('Child not found during session logging:', childError)
    return { success: false, error: 'Student profile not found' }
  }

  const today = new Date().toISOString().split('T')[0]
  const lastPractice = child?.last_practice_date

  let newStreak = child?.current_streak || 0
  if (lastPractice !== today) {
    newStreak += 1
  }

  const xpGained = score * 10
  const newXP = (child?.xp || 0) + xpGained
  const newLevel = calculateLevel(newXP)
  const isLevelUp = newLevel > (child?.level || 1)

  await supabase
    .from('children')
    .update({
      total_points: (child?.total_points || 0) + xpGained,
      xp: newXP,
      level: newLevel,
      current_streak: newStreak,
      last_practice_date: today
    })
    .eq('id', childId)

  revalidatePath('/dashboard')
  revalidatePath('/analytics')
  revalidatePath('/leaderboard')
  
  return { 
    success: true, 
    newStreak, 
    xpGained,
    newXP,
    newLevel,
    isLevelUp
  }
}
