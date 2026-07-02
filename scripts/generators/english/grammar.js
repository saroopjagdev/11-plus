// Grammar & Punctuation — "which sentence is correct?". The correct option is
// always an UNTOUCHED verified sentence; every distractor is a DIFFERENT
// sentence with a hand-authored single error injected. Because only the
// untouched sentence is guaranteed error-free, and the Oxford comma is never
// used as the deciding error, this cannot produce the multiple-correct problem
// Helen hit.

const { pick, sample } = require('../lib/random');
const { finalize } = require('../lib/assemble');
const DATA = require('../../data/sentences');

const SUBJECT = 'English';

function generate(difficulty, topic = 'Punctuation') {
  const tier = DATA.filter((e) => e.difficulty === difficulty);
  const pool = tier.length >= 5 ? tier : DATA;
  if (pool.length < 5) return null;

  const chosen = sample(pool, 5);
  const [correctEntry, ...wrongEntries] = chosen;

  const distractors = wrongEntries.map((e) => {
    const variants = Object.values(e.errors);
    return pick(variants);
  });

  return finalize({
    subject: SUBJECT, topic, difficulty,
    question_text: `Which of these sentences is correctly written?`,
    correct: correctEntry.correct,
    distractors,
    explanation: `"${correctEntry.correct}" has no errors. Each of the other sentences contains a genuine grammar or punctuation mistake.`,
  });
}

module.exports = {
  generate: (difficulty) => generate(difficulty, 'Grammar'),
  generateForTopic: generate, // shared with punctuation.js
  TOPIC: 'Grammar',
  SUBJECT,
};

if (require.main === module) {
  for (const d of ['Easy', 'Medium', 'Hard']) {
    console.log(`\n=== ${d} ===`);
    for (let i = 0; i < 4; i += 1) { const q = generate(d); if (q) console.log(`${q.question_text}\n   [${q.options.join(' | ')}]\n   ✓ ${q.correct_answer}`); }
  }
}
