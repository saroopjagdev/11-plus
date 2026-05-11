import { SupabaseClient } from '@supabase/supabase-js'

export interface Recommendation {
  id: string
  subject: string
  topic: string
  accuracy: number
  type: 'warmup' | 'focus' | 'challenge'
  action: {
    label: string
    href: string
  }
}

export async function getStudentRecommendations(supabase: SupabaseClient, childId: string): Promise<Recommendation[]> {
  // 1. Fetch Topic Mastery
  const { data: mastery } = await supabase
    .from('topic_mastery')
    .select('*')
    .eq('child_id', childId)
    .order('accuracy', { ascending: true })

  const recommendations: Recommendation[] = []
  const subjects = ['Maths', 'English', 'Verbal Reasoning']

  // FALLBACK: If no data, give default subjects
  if (!mastery || mastery.length === 0) {
    return [
      {
        id: 'warmup-maths',
        subject: 'Maths',
        topic: 'Arithmetic',
        accuracy: 0,
        type: 'warmup',
        action: { label: 'Maths: Arithmetic', href: '/practice/topic/Arithmetic?length=10&mission=true' }
      },
      {
        id: 'focus-english',
        subject: 'English',
        topic: 'Vocabulary',
        accuracy: 0,
        type: 'focus',
        action: { label: 'English: Vocabulary', href: '/practice/topic/Vocabulary?length=15&mission=true' }
      },
      {
        id: 'challenge-reasoning',
        subject: 'Verbal Reasoning',
        topic: 'Coding',
        accuracy: 0,
        type: 'challenge',
        action: { label: 'Reasoning: Coding', href: '/practice/topic/Coding?length=15&mission=true' }
      }
    ]
  }

  // 1. FOCUS (Weakest overall)
  const focus = mastery.find(m => m.accuracy < 85) || mastery[0]
  recommendations.push({
    id: focus.id,
    subject: focus.subject,
    topic: focus.topic,
    accuracy: focus.accuracy,
    type: 'focus',
    action: {
      label: `Focus Area: ${focus.topic}`,
      href: `/practice/topic/${encodeURIComponent(focus.topic)}?length=15&mission=true`
    }
  })

  // 2. WARMUP (A different subject, preferably strong)
  const remainingSubjects = subjects.filter(s => s !== focus.subject)
  const warmupSubject = remainingSubjects[0]
  const warmup = mastery.find(m => m.subject === warmupSubject && m.accuracy >= 70) 
    || mastery.find(m => m.subject === warmupSubject)
    || { subject: warmupSubject, topic: warmupSubject === 'Maths' ? 'Arithmetic' : warmupSubject === 'English' ? 'Vocabulary' : 'Coding', accuracy: 0, id: 'fallback-w' }

  recommendations.push({
    id: warmup.id,
    subject: warmup.subject,
    topic: warmup.topic,
    accuracy: warmup.accuracy,
    type: 'warmup',
    action: {
      label: `Warm-up: ${warmup.topic}`,
      href: `/practice/topic/${encodeURIComponent(warmup.topic)}?length=10&mission=true`
    }
  })

  // 3. CHALLENGE (The 3rd subject, push for mastery)
  const lastSubject = remainingSubjects[1]
  const challenge = mastery.find(m => m.subject === lastSubject && m.accuracy >= 85)
    || mastery.find(m => m.subject === lastSubject)
    || { subject: lastSubject, topic: lastSubject === 'Maths' ? 'Fractions' : lastSubject === 'English' ? 'Comprehension' : 'Synonyms', accuracy: 0, id: 'fallback-c' }

  recommendations.push({
    id: challenge.id,
    subject: challenge.subject,
    topic: challenge.topic,
    accuracy: challenge.accuracy,
    type: 'challenge',
    action: {
      label: `Challenge: ${challenge.topic}`,
      href: `/practice/topic/${encodeURIComponent(challenge.topic)}?length=15&mission=true`
    }
  })

  return recommendations
}
