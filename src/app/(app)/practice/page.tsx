import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getStudentRecommendations } from '@/lib/recommendations'

export const dynamic = 'force-dynamic'

// Bare `/practice` has no topic/category of its own to build a session
// around. It exists only as a landing target for CTAs that don't specify
// one — the Library Handbook's "Start Practice" and the Leaderboard's
// "Start My Next Session" both point here. It used to fetch 10 questions
// with no `.order()`/randomization, which deterministically returned the
// same `Maths::Arithmetic` rows for every child, forever.
//
// Fix: redirect to the same "what should this child practice next" pick
// the dashboard and study plan already compute (weakest-topic focus
// recommendation from `getStudentRecommendations`), instead of inventing a
// second heuristic here. That target route (`/practice/topic/[category]`)
// already does real randomization/adaptive selection within the topic.
export default async function PracticePage() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/login')
  }

  const { data: children } = await supabase
    .from('children')
    .select('id')
    .eq('parent_id', user.id)
    .limit(1)

  const childId = children?.[0]?.id

  if (!childId) {
    // No child profile yet (e.g. between signup and the onboarding modal) —
    // there is nothing to base a recommendation on yet.
    redirect('/dashboard')
  }

  const recommendations = await getStudentRecommendations(supabase, childId)
  const focus = recommendations.find((r) => r.type === 'focus') || recommendations[0]

  redirect(focus?.action.href || '/dashboard')
}
