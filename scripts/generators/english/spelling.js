// Spelling — "which is the correct spelling?". Answer + distractors come from
// vetted data, so only one option is genuinely correct.

const { pick, sample } = require('../lib/random');
const { finalize } = require('../lib/assemble');
const DATA = require('../../data/spelling');

const SUBJECT = 'English';
const TOPIC = 'Spelling';

// Multiple phrasings of the same instruction. Picking one per question means
// the pool's real ceiling is (entries × stems), not just entries — a small
// data file still produces plenty of genuinely distinct rows.
const STEMS = [
  'Which of these is spelled correctly?',
  'Choose the correctly spelled word.',
  'Select the word that is spelled correctly.',
  'Which spelling is correct?',
  'Pick the correct spelling from the options below.',
];

function generate(difficulty) {
  const tier = DATA.filter((e) => e.difficulty === difficulty);
  const entry = pick(tier.length ? tier : DATA);
  const distractors = sample(entry.misspellings, 4);
  if (distractors.length < 4) return null;

  return finalize({
    subject: SUBJECT, topic: TOPIC, difficulty,
    question_text: pick(STEMS),
    correct: entry.correct,
    distractors,
    explanation: `"${entry.correct}" is the correct spelling. The other options are common misspellings.`,
  });
}

module.exports = { generate, TOPIC, SUBJECT };

if (require.main === module) {
  for (const d of ['Easy', 'Medium', 'Hard']) {
    console.log(`\n=== ${d} ===`);
    for (let i = 0; i < 4; i += 1) { const q = generate(d); if (q) console.log(`${q.question_text}  [${q.options.join(' | ')}]  ✓ ${q.correct_answer}`); }
  }
}
