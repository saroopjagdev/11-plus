// Hidden Words — find the small word hidden across two neighbouring words.
// Distractors are other short words verified NOT to appear in the sentence's
// letter stream, so exactly one option is findable.

const { pick, sample } = require('../lib/random');
const { finalize } = require('../lib/assemble');
const DATA = require('../../data/hiddenwords');
const { hiddenWords } = require('../../data/words');

const SUBJECT = 'Verbal Reasoning';
const TOPIC = 'Hidden Words';

// The sentence letter stream (spaces/punctuation removed, lower-cased).
function stream(sentence) {
  return sentence.toLowerCase().replace(/[^a-z]/g, '');
}

function generate(difficulty) {
  const tier = DATA.filter((e) => e.difficulty === difficulty);
  const entry = pick(tier.length ? tier : DATA);
  const letters = stream(entry.sentence);

  // Distractors: words not present anywhere in the letter stream.
  const candidates = hiddenWords.filter((w) => w !== entry.hidden && !letters.includes(w));
  const distractors = sample(candidates, 8);
  if (distractors.length < 4) return null;

  return finalize({
    subject: SUBJECT, topic: TOPIC, difficulty,
    question_text: `A small word is hidden across two neighbouring words in this sentence: "${entry.sentence}" Which word is it?`,
    correct: entry.hidden,
    distractors,
    explanation: `Reading across the gap, the letters spell "${entry.hidden}" (hidden where two words meet). The other words do not appear in the sentence.`,
  });
}

module.exports = { generate, TOPIC, SUBJECT };

if (require.main === module) {
  for (const d of ['Easy', 'Medium', 'Hard']) {
    console.log(`\n=== ${d} ===`);
    for (let i = 0; i < 3; i += 1) { const q = generate(d); if (q) console.log(`${q.question_text}\n   [${q.options.join(' | ')}]  ✓ ${q.correct_answer}`); }
  }
}
