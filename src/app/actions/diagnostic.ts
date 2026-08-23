'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { calculateLevel } from '@/lib/gamification'
import OpenAI from 'openai'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { deriveHasEverMastered, normalizeSubjectAndTopic } from '@/lib/tracking'
import { logFunnelEvent } from '@/lib/funnel'
import { getAttribution } from '@/lib/attribution'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface TopicResult {
  topic: string
  subject: string
  correct: number
  total: number
}

export interface DiagnosticTopicBreakdown {
  topic: string
  subject: string
  accuracy: number
  questions_answered: number
}

interface CapturedLeadPayload {
  email: string
  score: number
  breakdown: DiagnosticTopicBreakdown[]
  aiSummary: string
  landingPath?: string | null
  referralCode?: string | null
}

function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function persistDiagnosticForChild(
  childId: string,
  data: { score: number; breakdown: DiagnosticTopicBreakdown[]; aiSummary: string }
) {
  const supabase = await createClient()
  const normalizedBreakdown = data.breakdown.map((item) => {
    const normalized = normalizeSubjectAndTopic(item.subject, item.topic)
    return {
      ...item,
      subject: normalized.subject,
      topic: normalized.topic,
    }
  })

  const { data: diagnostic, error: diagError } = await supabase
    .from('diagnostic_results')
    .insert({
      child_id: childId,
      score: data.score,
      topic_breakdown: normalizedBreakdown,
      ai_summary: data.aiSummary,
    })
    .select()
    .single()

  if (diagError) throw new Error(diagError.message)

  const { data: existingMasteryRows } = await supabase
    .from('topic_mastery')
    .select('topic')
    .eq('child_id', childId)

  const existingTopics = new Set((existingMasteryRows || []).map((row) => row.topic))

  const baselineRows = normalizedBreakdown
    .filter((topic) => !existingTopics.has(topic.topic))
    .map((topic) => ({
      child_id: childId,
      subject: topic.subject,
      topic: topic.topic,
      accuracy: topic.accuracy,
      questions_answered: topic.questions_answered || 0,
      has_ever_mastered: deriveHasEverMastered(topic.accuracy, topic.questions_answered || 0),
      last_updated: new Date().toISOString(),
    }))

  if (baselineRows.length > 0) {
    const { error: masteryInsertError } = await supabase.from('topic_mastery').insert(baselineRows)
    if (masteryInsertError) throw new Error(masteryInsertError.message)
  }

  revalidatePath('/dashboard')
  return diagnostic
}

export async function submitDiagnostic(
  childId: string | null,
  attempts: { questionId: string; isCorrect: boolean; topic: string; subject: string }[]
) {
  const supabase = await createClient()

  try {
    const normalizedAttempts = attempts.map((attempt) => {
      const normalized = normalizeSubjectAndTopic(attempt.subject, attempt.topic)
      return {
        ...attempt,
        subject: normalized.subject,
        topic: normalized.topic,
      }
    })

    const score = normalizedAttempts.filter((attempt) => attempt.isCorrect).length

    const topics: Record<string, TopicResult> = {}

    normalizedAttempts.forEach((attempt) => {
      if (!topics[attempt.topic]) {
        topics[attempt.topic] = {
          topic: attempt.topic,
          subject: attempt.subject,
          correct: 0,
          total: 0,
        }
      }
      topics[attempt.topic].total += 1
      if (attempt.isCorrect) topics[attempt.topic].correct += 1
    })

    const topicBreakdown: DiagnosticTopicBreakdown[] = Object.values(topics).map((topic) => ({
      topic: topic.topic,
      subject: topic.subject,
      accuracy: Math.round((topic.correct / topic.total) * 100),
      questions_answered: topic.total,
    }))

    if (!childId) {
      const prompt = `
        You are an expert, direct 11+ tutor. Analyze these diagnostic results for a prospective student.
        The 11+ is extremely competitive. If they aren't at 100%, they aren't "11+ Ready" yet.
        
        Overall Score: ${score} / ${normalizedAttempts.length}
        Topic Breakdown: ${JSON.stringify(topicBreakdown)}

        Provide a blunt, honest, and professional tutor-style review (2-3 sentences). 
        - DO NOT be overly flowery or use "AI" enthusiasm. 
        - Tell them exactly where they stand: "Foundation", "Developing", or "Competent".
        - State clearly what needs to be fixed to reach 100%.
        - Example: "Saroop is currently at the Developing level. While they understand Synonyms, the failure in Fractions and Decimals will be a barrier to entry at top schools. We need to drill these weak points immediately to reach 100% readiness."
        STRICT: NO markdown bolding (**). NO flowery adjectives like "wonderful". NO mention of AI.
      `

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
      })

      const aiSummary = response.choices[0].message.content || ''

      await logFunnelEvent('diagnostic_completed', {
        properties: { score, isGuest: true },
      })

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
      You are an expert, direct 11+ tutor. Analyze the following results for ${child.name || 'the student'}.
      The 11+ standard is 100% readiness.

      Overall Score: ${score} / ${normalizedAttempts.length}
      Topic Breakdown: ${JSON.stringify(topicBreakdown)}

      Provide a blunt, honest review (2-3 sentences). 
      - Identify the exact topics holding them back from 100%.
      - No "AI" fluff or "wonderful" adjectives.
      - Be direct about the competitive reality.
      STRICT: NO markdown bolding (**). NO mention of AI.
    `

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
    })

    const aiSummary = response.choices[0].message.content || ''
    const diagnostic = await persistDiagnosticForChild(childId, {
      score,
      breakdown: topicBreakdown,
      aiSummary,
    })

    const xpGained = score * 50
    const newXP = (child.xp || 0) + xpGained
    const newLevel = calculateLevel(newXP)
    const isLevelUp = newLevel > (child.level || 1)

    await supabase
      .from('children')
      .update({
        total_points: (child.total_points || 0) + xpGained,
        xp: newXP,
        level: newLevel,
      })
      .eq('id', childId)

    await logFunnelEvent('diagnostic_completed', {
      properties: { score, isGuest: false },
    })

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
      xpGained,
    }
  } catch (error: unknown) {
    console.error('Diagnostic Submission Error:', error)

    if (
      typeof error === 'object' &&
      error &&
      ('status' in error || 'code' in error) &&
      ((error as { status?: number }).status === 429 ||
        (error as { code?: string }).code === 'insufficient_quota')
    ) {
      throw new Error(
        "AI Credits Exceeded: We reached our daily limit for AI tutor help. Don't worry, your practice scores are saved, but the AI summary is unavailable right now."
      )
    }

    throw new Error('Failed to save diagnostic results. Please try again.')
  }
}

export async function captureLead(payload: CapturedLeadPayload) {
  const supabase = createAdminClient()
  const normalizedEmail = payload.email.trim().toLowerCase()

  if (!normalizedEmail) {
    throw new Error('Email is required')
  }

  const { data: existingLead } = await supabase
    .from('leads')
    .select('id')
    .eq('email', normalizedEmail)
    .eq('source', 'diagnostic')
    .in('status', ['captured', 'signup_started', 'account_created'])
    .is('claimed_by_user_id', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const leadPayload = {
    email: normalizedEmail,
    source: 'diagnostic',
    status: 'captured',
    diagnostic_score: payload.score,
    diagnostic_breakdown: payload.breakdown,
    diagnostic_ai_summary: payload.aiSummary,
    diagnostic_completed_at: new Date().toISOString(),
    referral_code: payload.referralCode ?? null,
    landing_path: payload.landingPath ?? '/diagnostic',
    updated_at: new Date().toISOString(),
  }

  if (existingLead?.id) {
    const { error } = await supabase
      .from('leads')
      .update(leadPayload)
      .eq('id', existingLead.id)

    if (error) throw new Error(error.message)
    return { success: true as const, leadId: existingLead.id }
  }

  // Attribution is only set on the initial insert, never on the update branch
  // above — first-touch, not last-touch. A guest who retakes the diagnostic
  // days later should keep whatever channel originally brought them in.
  const attribution = await getAttribution()

  const { data: lead, error } = await supabase
    .from('leads')
    .insert({
      ...leadPayload,
      ...attribution,
      created_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error || !lead) {
    throw new Error(error?.message || 'Failed to capture lead')
  }

  await logFunnelEvent('lead_captured', {
    leadId: lead.id,
    properties: {
      score: leadPayload.diagnostic_score,
      landingPath: leadPayload.landing_path,
      utmSource: attribution.utm_source,
      referrer: attribution.landing_referrer,
    },
  })

  return { success: true as const, leadId: lead.id }
}

export async function claimGuestDiagnostic(
  childId: string,
  data: { score: number; breakdown: DiagnosticTopicBreakdown[]; aiSummary: string }
) {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false as const, error: 'Please sign in again and try claiming the result.' }
  }

  const { data: child } = await supabase
    .from('children')
    .select('id')
    .eq('id', childId)
    .eq('parent_id', user.id)
    .maybeSingle()

  if (!child) {
    return { success: false as const, error: 'We could not find the student profile for this result.' }
  }

  try {
    await persistDiagnosticForChild(childId, data)
    return { success: true as const }
  } catch (error) {
    console.error('Claim guest diagnostic failed:', error)
    return {
      success: false as const,
      error: 'We could not attach that diagnostic right now. Please try again.',
    }
  }
}

export async function claimLeadDiagnosticForUser(userId: string, childId: string) {
  const admin = createAdminClient()

  const { data: lead } = await admin
    .from('leads')
    .select('*')
    .eq('claimed_by_user_id', userId)
    .eq('source', 'diagnostic')
    .in('status', ['account_created', 'captured'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!lead || !lead.diagnostic_breakdown || lead.diagnostic_score == null) {
    return { success: false as const, reason: 'no_claimable_lead' }
  }

  const supabase = await createClient()
  const { data: existingDiagnostic } = await supabase
    .from('diagnostic_results')
    .select('id')
    .eq('child_id', childId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existingDiagnostic) {
    await admin
      .from('leads')
      .update({ status: 'claimed', updated_at: new Date().toISOString() })
      .eq('id', lead.id)

    return { success: true as const, claimed: false, reason: 'already_has_diagnostic' }
  }

  await persistDiagnosticForChild(childId, {
    score: lead.diagnostic_score as number,
    breakdown: lead.diagnostic_breakdown as DiagnosticTopicBreakdown[],
    aiSummary: (lead.diagnostic_ai_summary as string) || '',
  })

  await admin
    .from('leads')
    .update({
      status: 'claimed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', lead.id)

  return { success: true as const, claimed: true, leadId: lead.id }
}
