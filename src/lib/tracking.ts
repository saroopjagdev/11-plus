import { MASTERY_THRESHOLD, MIN_QUESTIONS_FOR_MASTERY } from '@/lib/constants/curriculum'

export const CANONICAL_SUBJECTS = ['Maths', 'English', 'Verbal Reasoning'] as const

type CanonicalSubject = (typeof CANONICAL_SUBJECTS)[number]

const TOPIC_SUBJECT_OVERRIDES: Record<string, CanonicalSubject> = {
  arithmetic: 'Maths',
  fractions: 'Maths',
  decimals: 'Maths',
  percentages: 'Maths',
  'ratio & proportion': 'Maths',
  algebra: 'Maths',
  geometry: 'Maths',
  'data interpretation': 'Maths',
  'word problems': 'Maths',
  time: 'Maths',
  punctuation: 'English',
  spelling: 'English',
  grammar: 'English',
  vocabulary: 'English',
  comprehension: 'English',
  synonyms: 'Verbal Reasoning',
  antonyms: 'Verbal Reasoning',
  coding: 'Verbal Reasoning',
  'number series': 'Verbal Reasoning',
  'word completion': 'Verbal Reasoning',
  analogies: 'Verbal Reasoning',
}

const SUBJECT_NORMALIZATION: Record<string, CanonicalSubject> = {
  maths: 'Maths',
  math: 'Maths',
  english: 'English',
  'verbal reasoning': 'Verbal Reasoning',
  reasoning: 'Verbal Reasoning',
}

function cleanLabel(value: string | null | undefined) {
  return (value || '').replace(/\s+/g, ' ').trim()
}

function normalizeLabelKey(value: string | null | undefined) {
  return cleanLabel(value).toLowerCase()
}

export function normalizeTopic(topic: string | null | undefined) {
  return cleanLabel(topic)
}

export function normalizeSubjectAndTopic(subject: string | null | undefined, topic: string | null | undefined) {
  const normalizedTopic = normalizeTopic(topic)
  const topicKey = normalizeLabelKey(normalizedTopic)
  const subjectKey = normalizeLabelKey(subject)

  const canonicalSubject =
    TOPIC_SUBJECT_OVERRIDES[topicKey] ||
    SUBJECT_NORMALIZATION[subjectKey] ||
    cleanLabel(subject) ||
    'English'

  return {
    subject: canonicalSubject,
    topic: normalizedTopic,
  }
}

export function sanitizeSelectedAnswer(value: string | null | undefined, maxLength = 2000) {
  if (value == null) return null

  const trimmed = value.trim()
  if (!trimmed) return null

  return trimmed.length > maxLength ? trimmed.slice(0, maxLength) : trimmed
}

export function deriveHasEverMastered(
  accuracy: number | null | undefined,
  questionsAnswered: number | null | undefined,
  existing = false
) {
  if (existing) return true

  const safeAccuracy = Number(accuracy || 0)
  const safeQuestionsAnswered = Number(questionsAnswered || 0)

  return safeAccuracy >= MASTERY_THRESHOLD && safeQuestionsAnswered >= MIN_QUESTIONS_FOR_MASTERY
}

export interface AttemptAggregate {
  childId: string
  subject: string
  topic: string
  questionsAnswered: number
  correctAnswers: number
  accuracy: number
}

export function calculateAggregateAccuracy(correctAnswers: number, questionsAnswered: number) {
  if (questionsAnswered <= 0) return 0
  return Math.round((correctAnswers / questionsAnswered) * 100)
}
