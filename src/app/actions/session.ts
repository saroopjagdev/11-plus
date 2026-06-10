'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { calculateLevel } from '@/lib/gamification'
import {
  calculateAggregateAccuracy,
  deriveHasEverMastered,
  normalizeSubjectAndTopic,
  sanitizeSelectedAnswer,
} from '@/lib/tracking'

interface SessionResult {
  childId: string
  score: number
  attempts: {
    questionId: string
    selectedAnswer: string | null
    isCorrect: boolean
    timeTakenSeconds?: number
  }[]
  type?: 'practice' | 'diagnostic' | 'mock'
  startedAt?: string
  completedAt?: string
}

function ensureChronologicalTimestamps(startedAt?: string, completedAt?: string) {
  const safeStartedAt = startedAt || new Date().toISOString()
  const safeCompletedAt = completedAt || new Date().toISOString()

  if (new Date(safeCompletedAt).getTime() < new Date(safeStartedAt).getTime()) {
    return {
      startedAt: safeStartedAt,
      completedAt: safeStartedAt,
    }
  }

  return {
    startedAt: safeStartedAt,
    completedAt: safeCompletedAt,
  }
}

export async function logPracticeSession({
  childId,
  score,
  attempts,
  type = 'practice',
  startedAt,
  completedAt,
}: SessionResult) {
  const supabase = await createClient()
  const timestamps = ensureChronologicalTimestamps(startedAt, completedAt)

  // 1. Create the Session
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .insert({
      child_id: childId,
      score: score,
      type: type,
      started_at: timestamps.startedAt,
      completed_at: timestamps.completedAt,
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
    selected_answer: sanitizeSelectedAnswer(attempt.selectedAnswer),
    is_correct: attempt.isCorrect,
    time_taken_seconds: attempt.timeTakenSeconds || 0
  }))

  const { error: attemptsError } = await supabase
    .from('question_attempts')
    .insert(attemptsToInsert)

  if (attemptsError) console.error('Error logging attempts:', attemptsError)

  // 3. Update Topic Mastery from real attempt metadata
  const uniqueQuestionIds = Array.from(new Set(attempts.map((attempt) => attempt.questionId)))
  const { data: questions, error: questionsError } = await supabase
    .from('questions')
    .select('id, subject, topic')
    .in('id', uniqueQuestionIds)

  if (questionsError) {
    console.error('Error fetching questions for mastery update:', questionsError)
  } else {
    const questionMap = new Map(
      (questions || []).map((question) => [question.id, normalizeSubjectAndTopic(question.subject, question.topic)])
    )

    const aggregates = new Map<
      string,
      {
        subject: string
        topic: string
        questionsAnswered: number
        correctAnswers: number
      }
    >()

    for (const attempt of attempts) {
      const meta = questionMap.get(attempt.questionId)
      if (!meta || !meta.topic) continue

      const aggregateKey = `${meta.subject}::${meta.topic}`
      const existingAggregate = aggregates.get(aggregateKey) || {
        subject: meta.subject,
        topic: meta.topic,
        questionsAnswered: 0,
        correctAnswers: 0,
      }

      existingAggregate.questionsAnswered += 1
      if (attempt.isCorrect) {
        existingAggregate.correctAnswers += 1
      }

      aggregates.set(aggregateKey, existingAggregate)
    }

    const topics = Array.from(aggregates.values()).map((aggregate) => aggregate.topic)

    const { data: existingMasteryRows, error: masteryFetchError } = topics.length
      ? await supabase
          .from('topic_mastery')
          .select('*')
          .eq('child_id', childId)
          .in('topic', topics)
      : { data: [], error: null }

    if (masteryFetchError) {
      console.error('Error fetching existing mastery rows:', masteryFetchError)
    } else {
      const masteryByTopic = new Map((existingMasteryRows || []).map((row) => [row.topic, row]))

      for (const aggregate of aggregates.values()) {
        const existingMastery = masteryByTopic.get(aggregate.topic)
        const previousQuestionsAnswered = Number(existingMastery?.questions_answered || 0)
        const previousCorrectAnswers = Math.round(
          ((Number(existingMastery?.accuracy || 0) / 100) * previousQuestionsAnswered)
        )

        const questionsAnswered = previousQuestionsAnswered + aggregate.questionsAnswered
        const correctAnswers = previousCorrectAnswers + aggregate.correctAnswers
        const accuracy = calculateAggregateAccuracy(correctAnswers, questionsAnswered)
        const hasEverMastered = deriveHasEverMastered(
          accuracy,
          questionsAnswered,
          Boolean(existingMastery?.has_ever_mastered)
        )

        if (existingMastery) {
          await supabase
            .from('topic_mastery')
            .update({
              subject: aggregate.subject,
              topic: aggregate.topic,
              accuracy,
              has_ever_mastered: hasEverMastered,
              questions_answered: questionsAnswered,
              last_updated: timestamps.completedAt,
            })
            .eq('id', existingMastery.id)
        } else {
          await supabase
            .from('topic_mastery')
            .insert({
              child_id: childId,
              subject: aggregate.subject,
              topic: aggregate.topic,
              accuracy,
              has_ever_mastered: hasEverMastered,
              questions_answered: aggregate.questionsAnswered,
              last_updated: timestamps.completedAt,
            })
        }
      }
    }
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

  const today = timestamps.completedAt.split('T')[0]
  const lastPractice = child?.last_practice_date

  let newStreak = child?.current_streak || 0
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayValue = yesterday.toISOString().split('T')[0]

  if (lastPractice === today) {
    newStreak = child?.current_streak || 0
  } else if (lastPractice === yesterdayValue) {
    newStreak += 1
  } else {
    newStreak = 1
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
  revalidatePath('/parent/dashboard')
  
  return { 
    success: true, 
    newStreak, 
    xpGained,
    newXP,
    newLevel,
    isLevelUp
  }
}
