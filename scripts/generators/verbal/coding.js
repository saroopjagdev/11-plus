// Coding — Caesar-style letter shift. "If CAT is coded DBU, how is DOG coded?"
// The shift is applied in code, so the answer is always exact.

const { pick, randInt, sample } = require('../lib/random');
const { finalize } = require('../lib/assemble');
const { commonWords } = require('../../data/words');

const SUBJECT = 'Verbal Reasoning';
const TOPIC = 'Coding';

const A = 'A'.charCodeAt(0);
function shiftLetter(ch, by) {
  const i = ch.toUpperCase().charCodeAt(0) - A;
  return String.fromCharCode(A + ((i + by + 26) % 26));
}
function encode(word, by) {
  return word.toUpperCase().split('').map((c) => shiftLetter(c, by)).join('');
}

function generate(difficulty) {
  const tier = commonWords[difficulty] || commonWords.Medium;
  const example = pick(tier).toUpperCase();
  let target = pick(tier).toUpperCase();
  let guard = 0;
  while (target === example && guard++ < 10) target = pick(tier).toUpperCase();

  // Easy: single fixed shift. Hard: larger shift.
  const by = difficulty === 'Easy' ? pick([1, 2, -1]) : difficulty === 'Medium' ? pick([2, 3, -2, 4]) : pick([3, 4, 5, -3]);
  const codedExample = encode(example, by);
  const answer = encode(target, by);

  // Distractors: the same target under different shifts (all wrong). Exclude
  // shift 0 (mod 26) — that would just re-print the plaintext target, which is
  // not a sensible "coded" option and would be confusing/incorrect-looking.
  const wrongShifts = [by + 1, by - 1, by + 2, by - 2, -by]
    .filter((s) => s !== by && ((s % 26) + 26) % 26 !== 0);
  const distractors = [...new Set(wrongShifts.map((s) => encode(target, s)))].filter((w) => w !== answer);

  return finalize({
    subject: SUBJECT, topic: TOPIC, difficulty,
    question_text: `If ${example} is written in code as ${codedExample}, how is ${target} written in the same code?`,
    correct: answer,
    distractors,
    explanation: `Each letter moves ${Math.abs(by)} place${Math.abs(by) === 1 ? '' : 's'} ${by >= 0 ? 'forward' : 'back'} in the alphabet (${example} → ${codedExample}). Applying this to ${target} gives ${answer}.`,
  });
}

module.exports = { generate, TOPIC, SUBJECT };

if (require.main === module) {
  for (const d of ['Easy', 'Medium', 'Hard']) {
    console.log(`\n=== ${d} ===`);
    for (let i = 0; i < 4; i += 1) { const q = generate(d); if (q) console.log(`${q.question_text}\n   [${q.options.join(' | ')}]  ✓ ${q.correct_answer}`); }
  }
}
