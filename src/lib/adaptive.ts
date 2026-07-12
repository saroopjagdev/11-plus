/**
 * Adaptive difficulty engine.
 *
 * The goal is to keep a child in the "productive struggle" zone — roughly a
 * 70–80% success rate. Too easy and a capable child is bored (the exact
 * complaint we had: trivially easy questions even after a strong baseline);
 * too hard and they disengage. We do this in two layers:
 *
 *  1. Start at the right level using what we already know about the child:
 *     their mastery in this specific topic first, then their diagnostic
 *     baseline, then a sensible default.
 *  2. Adapt within the session based on a short rolling window of recent
 *     answers, nudging up after a couple right and down after a couple wrong.
 *
 * Everything here is pure so it can be reasoned about and unit-tested without
 * a database or a browser.
 */

export type Difficulty = 'Easy' | 'Medium' | 'Hard'

export const DIFFICULTY_ORDER: Difficulty[] = ['Easy', 'Medium', 'Hard']

const RANK: Record<Difficulty, number> = { Easy: 0, Medium: 1, Hard: 2 }

function clampRank(rank: number): Difficulty {
  const bounded = Math.max(0, Math.min(2, rank))
  return DIFFICULTY_ORDER[bounded]
}

export interface StartingDifficultyInputs {
  /** Child's accuracy (0–100) in this topic, if we have enough data. */
  masteryAccuracy?: number | null
  /** How many questions they've answered in this topic — our confidence signal. */
  masteryAnswered?: number | null
  /** Overall diagnostic score as a percentage (0–100), used as a fallback. */
  diagnosticPct?: number | null
}

// We only trust a topic's accuracy once there's a little history behind it,
// otherwise one lucky/unlucky question swings the starting point too much.
const MIN_ANSWERS_FOR_MASTERY_SIGNAL = 5

/**
 * Decide where to start a session. Prefers topic mastery (most specific),
 * falls back to the diagnostic baseline, then to Medium.
 *
 * Note the default is Medium, not Easy: starting everyone on Easy is what made
 * the app feel patronising to able children. Medium with quick downward
 * adaptation is a kinder default for a strong cohort.
 */
export function pickStartingDifficulty(inputs: StartingDifficultyInputs): Difficulty {
  const { masteryAccuracy, masteryAnswered, diagnosticPct } = inputs

  if (
    typeof masteryAccuracy === 'number' &&
    typeof masteryAnswered === 'number' &&
    masteryAnswered >= MIN_ANSWERS_FOR_MASTERY_SIGNAL
  ) {
    if (masteryAccuracy >= 80) return 'Hard'
    if (masteryAccuracy >= 55) return 'Medium'
    return 'Easy'
  }

  if (typeof diagnosticPct === 'number') {
    if (diagnosticPct >= 75) return 'Hard'
    if (diagnosticPct >= 50) return 'Medium'
    return 'Easy'
  }

  return 'Medium'
}

/**
 * Given the current target difficulty and the most recent results (true =
 * correct), decide the next target. We look at a short window so the response
 * is quick but not jumpy:
 *   - two in a row correct  → step up
 *   - two in a row wrong     → step down
 *   - otherwise              → hold
 *
 * `recentResults` should be ordered oldest→newest; only the last two matter.
 */
export function nextTargetDifficulty(current: Difficulty, recentResults: boolean[]): Difficulty {
  const lastTwo = recentResults.slice(-2)
  if (lastTwo.length < 2) return current

  if (lastTwo.every((r) => r === true)) return clampRank(RANK[current] + 1)
  if (lastTwo.every((r) => r === false)) return clampRank(RANK[current] - 1)
  return current
}

export interface DifficultyTagged {
  id: string
  difficulty?: Difficulty | string | null
  topic?: string
  correct_answer?: string | null
}

/**
 * Identifies the *underlying entry* a question was generated from, not just
 * the row. Templated generators (vocabulary, grammar/punctuation, spelling,
 * cloze, etc.) can produce several DB rows for the same entry — same
 * correct_answer, different question_text stem — so two rows can pass an
 * id-based used-check while still reading as "the same question again" to a
 * child (e.g. "What does 'gentle' mean?" and "Choose the meaning of
 * 'gentle'." are different rows testing the same word). Keying on
 * (topic, correct_answer) catches that. For procedurally-generated subjects
 * like Maths a coincidental shared answer just costs a little pool
 * diversity, which is a far smaller problem than the repeat itself.
 */
export function answerKey(question: { topic?: string; correct_answer?: string | null }): string | null {
  const answer = (question.correct_answer || '').trim().toLowerCase()
  if (!answer || !question.topic) return null
  return `${question.topic}::${answer}`
}

/**
 * Pick the next unused question, preferring the target difficulty and
 * searching outward (target, then ±1, then ±2) when the preferred bucket is
 * exhausted. This keeps sessions flowing even when the bank is thin at one
 * level. Returns null only when every question has been used.
 *
 * `historicIds` (optional) is a soft deprioritisation, not a hard exclude —
 * questions this child has answered before (in any past session). Within each
 * difficulty bucket we prefer candidates NOT in that set, only falling back to
 * historically-seen ones once the fresh supply in that bucket is exhausted.
 * This is what keeps a small topic pool feeling fresh across many sessions
 * instead of replaying the same recent handful.
 *
 * `usedAnswerKeys` (optional) excludes same-entry repeats *within this
 * session* — see `answerKey`. This is checked before the historicIds
 * preference and only relaxed if every candidate in the bucket would
 * otherwise be a same-entry repeat, since avoiding a repeat within one
 * sitting matters more than the cross-session freshness preference.
 */
export function pickQuestion<T extends DifficultyTagged>(
  pool: T[],
  usedIds: Set<string>,
  target: Difficulty,
  historicIds?: Set<string>,
  usedAnswerKeys?: Set<string>
): T | null {
  const targetRank = RANK[target]

  // Build a search order by distance from the target rank: e.g. for Medium →
  // [Medium, Easy, Hard]; for Easy → [Easy, Medium, Hard].
  const order = [...DIFFICULTY_ORDER].sort(
    (a, b) => Math.abs(RANK[a] - targetRank) - Math.abs(RANK[b] - targetRank)
  )

  const pickFrom = (candidates: T[]): T | null => {
    if (candidates.length === 0) return null

    const entryFresh = usedAnswerKeys
      ? candidates.filter((q) => {
          const key = answerKey(q)
          return !key || !usedAnswerKeys.has(key)
        })
      : candidates
    const base = entryFresh.length > 0 ? entryFresh : candidates

    const fresh = historicIds ? base.filter((q) => !historicIds.has(q.id)) : base
    const chooseFrom = fresh.length > 0 ? fresh : base
    // Randomise within the bucket so repeated sessions don't replay the same order.
    return chooseFrom[Math.floor(Math.random() * chooseFrom.length)]
  }

  for (const difficulty of order) {
    const candidates = pool.filter(
      (q) => !usedIds.has(q.id) && normaliseDifficulty(q.difficulty) === difficulty
    )
    const picked = pickFrom(candidates)
    if (picked) return picked
  }

  // No difficulty-tagged question left; fall back to any unused question.
  const anyLeft = pool.filter((q) => !usedIds.has(q.id))
  return pickFrom(anyLeft)
}

export function normaliseDifficulty(value: Difficulty | string | null | undefined): Difficulty {
  if (value === 'Easy' || value === 'Medium' || value === 'Hard') return value
  return 'Medium'
}
