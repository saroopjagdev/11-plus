// Move-a-Letter — which single letter can be removed to leave a real word.
// Options are the word's own (distinct) letters; correctness is guaranteed by
// the hand-verified uniqueness in the data file.

const { pick } = require('../lib/random');
const { finalize } = require('../lib/assemble');
const DATA = require('../../data/moveletter');

const SUBJECT = 'Verbal Reasoning';
const TOPIC = 'Move-a-Letter';

function generate(difficulty) {
  const tier = DATA.filter((e) => e.difficulty === difficulty);
  const pool = tier.length ? tier : DATA;
  const entry = pick(pool);

  const distinct = [...new Set(entry.word.split(''))];
  if (distinct.length < 5) return null; // need 5 options
  const distractors = distinct.filter((l) => l !== entry.remove);

  return finalize({
    subject: SUBJECT, topic: TOPIC, difficulty,
    question_text: `Which letter can be removed from ${entry.word} to leave a new, real word?`,
    correct: entry.remove,
    distractors,
    explanation: `Removing "${entry.remove}" from ${entry.word} leaves "${entry.result}". Removing any other letter does not make a word.`,
  });
}

module.exports = { generate, TOPIC, SUBJECT };

if (require.main === module) {
  for (const d of ['Easy', 'Medium', 'Hard']) {
    console.log(`\n=== ${d} ===`);
    for (let i = 0; i < 4; i += 1) { const q = generate(d); if (q) console.log(`${q.question_text}  [${q.options.join(' | ')}]  ✓ ${q.correct_answer}`); }
  }
}
