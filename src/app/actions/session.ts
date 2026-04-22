'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { calculateLevel } from '@/lib/gamification'

interface SessionResult {
  childId: string
  score: number
  attempts: {
    questionId: string
    selectedAnswer: string | null
    isCorrect: boolean
    timeTakenSeconds?: number
  }[]
}

export async function logPracticeSession({ childId, score, attempts }: SessionResult) {
  const supabase = await createClient()

  // 1. Create the Session
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .insert({
      child_id: childId,
      score: score,
      type: 'practice',
      completed_at: new Date().toISOString()
    })
    .select()
    .single()

  if (sessionError) throw new Error(sessionError.message)

  // 2. Log Individual Attempts
  const attemptsToInsert = attempts.map(attempt => ({
    session_id: session.id,
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

  // 3. Update Child Stats (Streak & Points)
  // Logic: Only increase streak if they haven't practiced yet today
  const { data: child } = await supabase
    .from('children')
    .select('total_points, xp, level, current_streak, last_practice_date')
    .eq('id', childId)
    .single() as any

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
