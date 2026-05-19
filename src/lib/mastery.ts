import { CURRICULUM_LADDER, MASTERY_TIERS, type TopicPrerequisite } from '@/lib/constants/curriculum'

export interface TopicMasteryLike {
  topic?: string | null
  subject?: string | null
  accuracy?: number | null
  questions_answered?: number | null
  mastery_level?: number | null
}

function toNumber(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

export function calculateMasteryLevel(record: Pick<TopicMasteryLike, 'accuracy' | 'questions_answered'> | null | undefined) {
  if (!record) return 0

  const accuracy = toNumber(record.accuracy)
  const questionsAnswered = toNumber(record.questions_answered)

  for (const tier of [...MASTERY_TIERS].reverse()) {
    if (accuracy >= tier.minAccuracy && questionsAnswered >= tier.minQuestions) {
      return tier.level
    }
  }

  return 0
}

export function getMasteryLevel(record: TopicMasteryLike | null | undefined) {
  if (!record) return 0

  const storedLevel = toNumber(record.mastery_level)
  if (storedLevel > 0) {
    return storedLevel
  }

  return calculateMasteryLevel(record)
}

export function getMasteryTier(record: TopicMasteryLike | null | undefined) {
  const level = getMasteryLevel(record)
  return MASTERY_TIERS.find((tier) => tier.level === level) ?? null
}

export function getNextMasteryTier(record: TopicMasteryLike | null | undefined) {
  const level = getMasteryLevel(record)
  return MASTERY_TIERS.find((tier) => tier.level === level + 1) ?? null
}

export function isTopicMastered(record: TopicMasteryLike | null | undefined) {
  return getMasteryLevel(record) >= 1
}

export function getProgressToNextTier(record: TopicMasteryLike | null | undefined) {
  const nextTier = getNextMasteryTier(record)
  if (!nextTier) return 100

  const accuracy = Math.max(0, toNumber(record?.accuracy))
  const questionsAnswered = Math.max(0, toNumber(record?.questions_answered))
  const accuracyProgress = Math.min(accuracy / nextTier.minAccuracy, 1)
  const questionProgress = Math.min(questionsAnswered / nextTier.minQuestions, 1)

  return Math.max(0, Math.min(100, Math.round(Math.min(accuracyProgress, questionProgress) * 100)))
}

export function getMasteryStatusLabel(record: TopicMasteryLike | null | undefined) {
  const tier = getMasteryTier(record)
  if (tier) return tier.label

  const nextTier = getNextMasteryTier(record)
  const questionsAnswered = toNumber(record?.questions_answered)

  if (questionsAnswered === 0) {
    return 'Not started'
  }

  return nextTier ? `Working toward ${nextTier.label}` : 'In progress'
}

export function getTopicRecord(
  mastery: TopicMasteryLike[] | null | undefined,
  topic: string
) {
  return mastery?.find((item) => item.topic === topic) ?? null
}

export function getTopicPrerequisite(
  topic: string,
  curriculum: TopicPrerequisite[] = CURRICULUM_LADDER
) {
  return curriculum.find((item) => item.topic === topic)?.prerequisite ?? null
}

export function isTopicUnlocked(
  topic: string,
  mastery: TopicMasteryLike[] | null | undefined,
  curriculum: TopicPrerequisite[] = CURRICULUM_LADDER
) {
  const prerequisite = getTopicPrerequisite(topic, curriculum)
  if (!prerequisite) return true

  return isTopicMastered(getTopicRecord(mastery, prerequisite))
}

export function getRecommendedPrerequisiteHref(
  topic: string,
  curriculum: TopicPrerequisite[] = CURRICULUM_LADDER
) {
  const prerequisite = getTopicPrerequisite(topic, curriculum)
  return prerequisite ? `/practice/topic/${encodeURIComponent(prerequisite)}` : '/dashboard'
}
