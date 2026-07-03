// Odd one out — four words share a category, one does not. The outsider is the
// answer; the four members are the distractors.

const { pick, sample } = require('../lib/random');
const { finalize } = require('../lib/assemble');
const DATA = require('../../data/categories');

const SUBJECT = 'Verbal Reasoning';
const TOPIC = 'Odd One Out';

const STEMS = [
  'Which word is the odd one out?',
  'Which word does not belong with the others?',
  "Choose the word that doesn't fit the group.",
  'Select the odd one out.',
];

function generate(difficulty) {
  const tier = DATA.filter((e) => e.difficulty === difficulty);
  if (tier.length < 1) return null;
  const cat = pick(tier);
  if (cat.members.length < 4 || cat.outsiders.length < 1) return null;

  const members = sample(cat.members, 4);
  const outsider = pick(cat.outsiders);

  return finalize({
    subject: SUBJECT, topic: TOPIC, difficulty,
    question_text: pick(STEMS),
    correct: outsider,
    distractors: members,
    explanation: `${members.join(', ')} are all ${cat.category}; "${outsider}" is not, so it is the odd one out.`,
  });
}

module.exports = { generate, TOPIC, SUBJECT };

if (require.main === module) {
  for (const d of ['Easy', 'Medium', 'Hard']) {
    console.log(`\n=== ${d} ===`);
    for (let i = 0; i < 4; i += 1) { const q = generate(d); if (q) console.log(`${q.question_text}  [${q.options.join(' | ')}]  ✓ ${q.correct_answer}\n   ${q.explanation}`); }
  }
}
