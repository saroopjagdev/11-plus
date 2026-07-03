// Compound Words — "which of these is a compound word?". The correct option is a
// known compound (two real words joined); distractors are plain nouns that are
// not compounds. Chosen over the "join two words" format because that risks
// accidental valid compounds (e.g. footbridge, sunlight) = multiple answers.

const { pick, sample } = require('../lib/random');
const { finalize } = require('../lib/assemble');
const { compounds, distractorPool } = require('../../data/words');

const SUBJECT = 'Verbal Reasoning';
const TOPIC = 'Compound Words';

const STEMS = [
  'Which of these is a compound word?',
  'Choose the word that is made up of two smaller words.',
  'Select the compound word from the options below.',
  'Which option is formed by joining two whole words together?',
];

function generate(difficulty) {
  const [whole, first, second] = pick(compounds);
  const distractors = sample(distractorPool, 8);

  return finalize({
    subject: SUBJECT, topic: TOPIC, difficulty,
    question_text: pick(STEMS),
    correct: whole,
    distractors,
    explanation: `"${whole}" is made of two smaller words: "${first}" + "${second}". The others are single words.`,
  });
}

module.exports = { generate, TOPIC, SUBJECT };

if (require.main === module) {
  for (const d of ['Easy', 'Medium', 'Hard']) {
    console.log(`\n=== ${d} ===`);
    for (let i = 0; i < 4; i += 1) { const q = generate(d); if (q) console.log(`${q.question_text}  [${q.options.join(' | ')}]  ✓ ${q.correct_answer}`); }
  }
}
