// Cloze — fill the blank. Vetted so exactly one option fits the sentence.

const { pick } = require('../lib/random');
const { finalize } = require('../lib/assemble');
const DATA = require('../../data/cloze');

const SUBJECT = 'English';
const TOPIC = 'Cloze';

const STEMS = [
  (s) => `Fill in the blank: "${s}"`,
  (s) => `Choose the word that best completes this sentence: "${s}"`,
  (s) => `Which word correctly completes this sentence: "${s}"`,
  (s) => `Select the best word for the blank: "${s}"`,
];

function generate(difficulty) {
  const tier = DATA.filter((e) => e.difficulty === difficulty);
  const entry = pick(tier.length ? tier : DATA);
  if (entry.distractors.length < 3) return null;

  return finalize({
    subject: SUBJECT, topic: TOPIC, difficulty,
    question_text: pick(STEMS)(entry.sentence),
    correct: entry.correct,
    distractors: entry.distractors,
    explanation: `"${entry.correct}" is the only option that makes sense in this sentence.`,
  });
}

module.exports = { generate, TOPIC, SUBJECT };

if (require.main === module) {
  for (const d of ['Easy', 'Medium', 'Hard']) {
    console.log(`\n=== ${d} ===`);
    for (let i = 0; i < 3; i += 1) { const q = generate(d); if (q) console.log(`${q.question_text}\n   [${q.options.join(' | ')}]  ✓ ${q.correct_answer}`); }
  }
}
