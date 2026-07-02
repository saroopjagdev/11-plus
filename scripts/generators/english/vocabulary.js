// Vocabulary in context — "which is the closest meaning of X?". Vetted meaning
// + tempting-but-wrong distractors from the data file.

const { pick } = require('../lib/random');
const { finalize } = require('../lib/assemble');
const DATA = require('../../data/vocabulary');

const SUBJECT = 'English';
const TOPIC = 'Vocabulary';

function generate(difficulty) {
  const tier = DATA.filter((e) => e.difficulty === difficulty);
  const entry = pick(tier.length ? tier : DATA);
  if (entry.distractors.length < 3) return null;

  return finalize({
    subject: SUBJECT, topic: TOPIC, difficulty,
    question_text: `What does the word "${entry.word}" mean?`,
    correct: entry.meaning,
    distractors: entry.distractors,
    explanation: `"${entry.word}" means "${entry.meaning}".`,
  });
}

module.exports = { generate, TOPIC, SUBJECT };

if (require.main === module) {
  for (const d of ['Easy', 'Medium', 'Hard']) {
    console.log(`\n=== ${d} ===`);
    for (let i = 0; i < 3; i += 1) { const q = generate(d); if (q) console.log(`${q.question_text}  [${q.options.join(' | ')}]  ✓ ${q.correct_answer}`); }
  }
}
