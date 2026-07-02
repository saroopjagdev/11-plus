// Word analogies — "A is to B as C is to ?". The relation guarantees a single
// correct completion; distractors come from other relations so none accidentally
// satisfies this one.

const { pick, sample, shuffle } = require('../lib/random');
const { finalize } = require('../lib/assemble');
const DATA = require('../../data/analogies');

const SUBJECT = 'Verbal Reasoning';
const TOPIC = 'Analogies';

function generate(difficulty) {
  const tier = DATA.filter((e) => e.difficulty === difficulty);
  if (tier.length < 2) return null;
  const relation = pick(tier);
  if (relation.pairs.length < 2) return null;

  const [example, target] = sample(relation.pairs, 2);
  const correct = target[1];

  // Distractors: the "B" words from other relations (wrong relationship), never
  // equal to the correct answer.
  const pool = [];
  for (const r of DATA) {
    if (r === relation) continue;
    for (const [, b] of r.pairs) if (b !== correct) pool.push(b);
  }
  const distractors = sample([...new Set(pool)], 8);

  return finalize({
    subject: SUBJECT, topic: TOPIC, difficulty,
    question_text: `${example[0].toUpperCase()} is to ${example[1].toUpperCase()} as ${target[0].toUpperCase()} is to ?`,
    correct,
    distractors,
    explanation: `${example[0]} → ${example[1]} shows the relationship "${relation.relation}". Applying it to ${target[0]} gives ${correct}.`,
  });
}

module.exports = { generate, TOPIC, SUBJECT };

if (require.main === module) {
  for (const d of ['Easy', 'Medium', 'Hard']) {
    console.log(`\n=== ${d} ===`);
    for (let i = 0; i < 4; i += 1) { const q = generate(d); if (q) console.log(`${q.question_text}  [${q.options.join(' | ')}]  ✓ ${q.correct_answer}`); }
  }
}
