// Number Series — find the next term. Sequences are built by code (arithmetic,
// geometric, alternating), so the answer is always exact.

const { pick, randInt } = require('../lib/random');
const { finalize } = require('../lib/assemble');

const SUBJECT = 'Verbal Reasoning';
const TOPIC = 'Number Series';

function intDistractors(correct, candidates) {
  const out = [];
  const seen = new Set([String(correct)]);
  for (const c of candidates) {
    if (!Number.isFinite(c) || c === correct) continue;
    const t = String(c);
    if (seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

function arithmetic(difficulty) {
  const start = randInt(1, 12);
  const step = randInt(2, difficulty === 'Hard' ? 12 : 6) * (difficulty === 'Hard' && Math.random() < 0.4 ? -1 : 1);
  const seq = [0, 1, 2, 3].map((i) => start + i * step);
  const answer = start + 4 * step;
  if (answer < 0) return null;
  return finalize({
    subject: SUBJECT, topic: TOPIC, difficulty,
    question_text: `What number comes next? ${seq.join(', ')}, ?`,
    correct: answer,
    distractors: intDistractors(answer, [answer + step, answer - step, answer + 1, answer - 1, answer + 2 * step]),
    explanation: `The sequence ${step >= 0 ? 'adds' : 'subtracts'} ${Math.abs(step)} each time, so the next term is ${answer}.`,
  });
}

function geometric(difficulty) {
  const start = randInt(1, 4);
  const ratio = pick([2, 3]);
  const seq = [0, 1, 2, 3].map((i) => start * ratio ** i);
  const answer = start * ratio ** 4;
  return finalize({
    subject: SUBJECT, topic: TOPIC, difficulty,
    question_text: `What number comes next? ${seq.join(', ')}, ?`,
    correct: answer,
    distractors: intDistractors(answer, [answer + seq[3], answer - seq[3], seq[3] * (ratio + 1), answer + ratio, answer / ratio + 1]),
    explanation: `Each term is multiplied by ${ratio}, so the next term is ${seq[3]} × ${ratio} = ${answer}.`,
  });
}

// Alternating: two interleaved patterns (Hard).
function alternating(difficulty) {
  const a0 = randInt(1, 9);
  const b0 = randInt(2, 9);
  const aStep = randInt(2, 6);
  const bStep = randInt(2, 6);
  const seq = [a0, b0, a0 + aStep, b0 + bStep, a0 + 2 * aStep, b0 + 2 * bStep];
  const answer = a0 + 3 * aStep; // next continues the "a" pattern
  return finalize({
    subject: SUBJECT, topic: TOPIC, difficulty,
    question_text: `What number comes next? ${seq.join(', ')}, ?`,
    correct: answer,
    distractors: intDistractors(answer, [b0 + 3 * bStep, answer + aStep, answer - aStep, answer + 1, seq[5] + bStep]),
    explanation: `Two patterns alternate: one adds ${aStep} (${a0}, ${a0 + aStep}, ${a0 + 2 * aStep}, ...) and the other adds ${bStep}. The next term continues the first pattern: ${answer}.`,
  });
}

const BY_DIFFICULTY = {
  Easy: [arithmetic],
  Medium: [arithmetic, geometric],
  Hard: [arithmetic, geometric, alternating],
};

function generate(difficulty) {
  const pool = BY_DIFFICULTY[difficulty] || BY_DIFFICULTY.Medium;
  for (let i = 0; i < 6; i += 1) {
    const q = pick(pool)(difficulty);
    if (q) return q;
  }
  return null;
}

module.exports = { generate, TOPIC, SUBJECT };

if (require.main === module) {
  for (const d of ['Easy', 'Medium', 'Hard']) {
    console.log(`\n=== ${d} ===`);
    for (let i = 0; i < 5; i += 1) { const q = generate(d); if (q) console.log(`${q.question_text}  [${q.options.join(' | ')}]  ✓ ${q.correct_answer}`); }
  }
}
