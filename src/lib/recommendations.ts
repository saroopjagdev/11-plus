import { SupabaseClient } from '@supabase/supabase-js'

export interface Recommendation {
  id: string
  subject: string
  topic: string
  accuracy: number
  type: 'weakness' | 'growth' | 'strength'
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

  if (!mastery || mastery.length === 0) return []

  const recommendations: Recommendation[] = []

  // 2. Identify Weaknesses (Accuracy < 65%)
  const weaknesses = mastery.filter(m => m.accuracy < 65).slice(0, 2)
  weaknesses.forEach(w => {
    recommendations.push({
      id: w.id,
      subject: w.subject,
      topic: w.topic,
      accuracy: w.accuracy,
      type: 'weakness',
      action: {
        label: `Master ${w.topic}`,
        href: `/practice/topic/${encodeURIComponent(w.topic)}`
      }
    })
  })

  // 3. Identify Growth Areas (Accuracy 65-85%)
  if (recommendations.length < 3) {
    const growth = mastery.filter(m => m.accuracy >= 65 && m.accuracy < 85).slice(0, 1)
    growth.forEach(g => {
      recommendations.push({
        id: g.id,
        subject: g.subject,
        topic: g.topic,
        accuracy: g.accuracy,
        type: 'growth',
        action: {
          label: `Polish ${g.topic}`,
          href: `/practice/topic/${encodeURIComponent(g.topic)}`
        }
      })
    })
  }

  // 4. Case where student is a pro (mostly high accuracy)
  if (recommendations.length === 0) {
    const strengths = mastery.slice(-1)
    strengths.forEach(s => {
      recommendations.push({
        id: s.id,
        subject: s.subject,
        topic: s.topic,
        accuracy: s.accuracy,
        type: 'strength',
        action: {
          label: `Challenge: ${s.topic}`,
          href: `/practice/topic/${encodeURIComponent(s.topic)}?difficulty=Hard`
        }
      })
    })
  }

  return recommendations
}
