// Ratio & Proportion generator — sharing, equivalent ratios, and the
// "difference between the parts" Hard type.

const { randInt, pick } = require('../lib/random');
const { finalize } = require('../lib/assemble');

const SUBJECT = 'Maths';
const TOPIC = 'Ratio & Proportion';

function gcd(a, b) { while (b) { [a, b] = [b, a % b]; } return a || 1; }

function intDistractors(correct, candidates) {
  const out = [];
  const seen = new Set([String(correct)]);
  for (const c of candidates) {
    if (!Number.isFinite(c) || c <= 0 || c === correct) continue;
    const t = String(Math.round(c));
    if (seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

// Share £T in ratio a:b — ask for one part.
function sharing(difficulty) {
  const a = randInt(1, difficulty === 'Hard' ? 7 : 4);
  let b = randInt(1, difficulty === 'Hard' ? 7 : 5);
  if (a === b) b += 1;
  const unit = randInt(difficulty === 'Hard' ? 6 : 3, difficulty === 'Hard' ? 20 : 10);
  const total = (a + b) * unit;
  const largerParts = Math.max(a, b);
  const smallerParts = Math.min(a, b);
  const askLarger = Math.random() < 0.5;
  const answer = (askLarger ? largerParts : smallerParts) * unit;
  const other = (askLarger ? smallerParts : largerParts) * unit;
  const distractors = intDistractors(answer, [
    other,                 // the other share
    total / 2,             // split evenly
    unit,                  // one part only
    answer + unit, answer - unit,
    total - answer + unit,
  ]);
  return finalize({
    subject: SUBJECT, topic: TOPIC, difficulty,
    question_text: `£${total} is shared in the ratio ${a}:${b}. What is the ${askLarger ? 'larger' : 'smaller'} share, in pounds?`,
    correct: answer,
    distractors,
    explanation: `There are ${a + b} parts, so one part is £${total} ÷ ${a + b} = £${unit}. The ${askLarger ? 'larger' : 'smaller'} share is ${askLarger ? largerParts : smallerParts} × £${unit} = £${answer}.`,
  });
}

// Equivalent ratio: a:b = ?:d
function equivalent(difficulty) {
  const base = [randInt(1, 6), randInt(1, 6)];
  const g = gcd(base[0], base[1]);
  const a = base[0] / g;
  const b = base[1] / g;
  const k = randInt(2, difficulty === 'Hard' ? 8 : 5);
  const shownRight = b * k;
  const answer = a * k;
  const distractors = intDistractors(answer, [
    shownRight, b + k, a + k, a * (k + 1), Math.round(shownRight / b) + a,
  ]);
  return finalize({
    subject: SUBJECT, topic: TOPIC, difficulty,
    question_text: `${a}:${b} is the same as ?:${shownRight}. What number replaces the ?`,
    correct: answer,
    distractors,
    explanation: `${b} was multiplied by ${k} to make ${shownRight}, so multiply ${a} by ${k} too: ${answer}.`,
  });
}

// Difference type (Hard): a:b, one part exceeds the other by D, find total.
function difference(difficulty) {
  let a = randInt(2, 7);
  let b = randInt(1, a - 1);
  const g = gcd(a, b); a /= g; b /= g;
  if (a === b) return null;
  const unit = randInt(3, 12);
  const diff = (a - b) * unit;
  const total = (a + b) * unit;
  const distractors = intDistractors(total, [
    diff, (a + b) * (unit + 1), a * unit, b * unit, total - unit, total + unit,
  ]);
  return finalize({
    subject: SUBJECT, topic: TOPIC, difficulty,
    question_text: `Two amounts are in the ratio ${a}:${b}. The larger is ${diff} more than the smaller. What is the total?`,
    correct: total,
    distractors,
    explanation: `The difference is ${a - b} parts = ${diff}, so one part is ${unit}. The total is ${a + b} parts = ${total}.`,
  });
}

const BY_DIFFICULTY = {
  Easy: [equivalent, sharing],
  Medium: [sharing, equivalent],
  Hard: [sharing, difference, equivalent],
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
    for (let i = 0; i < 6; i += 1) { const q = generate(d); if (q) console.log(`${q.question_text}  [${q.options.join(' | ')}]  ✓ ${q.correct_answer}`); }
  }
}
