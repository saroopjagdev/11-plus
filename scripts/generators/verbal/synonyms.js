// Synonyms — "which word means the same as X?". Answer is looked up from the
// vetted set; distractors are other tier words that are NOT synonyms of the
// target (near-misses of the same register, so the question is genuinely hard).

const { pick, sample } = require('../lib/random');
const { finalize } = require('../lib/assemble');
const DATA = require('../../data/synonyms');
const EXPLANATIONS = require('../../data/synonym-explanations');

const SUBJECT = 'Verbal Reasoning';
const TOPIC = 'Synonyms';

const STEMS = [
  (w) => `Which word means the same as ${w.toUpperCase()}?`,
  (w) => `Choose the word closest in meaning to ${w.toUpperCase()}.`,
  (w) => `Select a synonym for ${w.toUpperCase()}.`,
  (w) => `Which of these words is closest to ${w.toUpperCase()} in meaning?`,
];

function generate(difficulty) {
  const tier = DATA.filter((e) => e.difficulty === difficulty);
  if (tier.length < 3) return null;
  const entry = pick(tier);

  const correct = pick(entry.synonyms);
  const forbidden = new Set([entry.word.toLowerCase(), ...entry.synonyms.map((w) => w.toLowerCase())]);

  // Distractors: words from other entries, but skip the WHOLE entry if its
  // synonym set overlaps with this one's (e.g. "big" and "vast" both list
  // "enormous" — meaning they're near-synonyms of each other too, so any of
  // "vast"'s other synonyms could plausibly also mean "big" and risk a second
  // defensible answer). Only entries with no shared meaning are safe sources.
  const candidatePool = [];
  for (const e of DATA) {
    if (e === entry) continue;
    const eWords = new Set([e.word.toLowerCase(), ...e.synonyms.map((w) => w.toLowerCase())]);
    const overlaps = [...eWords].some((w) => forbidden.has(w));
    if (overlaps) continue; // whole entry excluded, not just the shared word
    for (const w of [e.word, ...e.synonyms]) candidatePool.push(w);
  }
  const distractors = sample([...new Set(candidatePool)], 8);

  const richExplanation = EXPLANATIONS[`${entry.word.toLowerCase()}:${correct.toLowerCase()}`];

  return finalize({
    subject: SUBJECT, topic: TOPIC, difficulty,
    question_text: pick(STEMS)(entry.word),
    correct,
    distractors,
    explanation: richExplanation || `"${correct}" means the same as "${entry.word}".`,
  });
}

module.exports = { generate, TOPIC, SUBJECT };

if (require.main === module) {
  for (const d of ['Easy', 'Medium', 'Hard']) {
    console.log(`\n=== ${d} ===`);
    for (let i = 0; i < 4; i += 1) { const q = generate(d); if (q) console.log(`${q.question_text}  [${q.options.join(' | ')}]  ✓ ${q.correct_answer}`); }
  }
}
