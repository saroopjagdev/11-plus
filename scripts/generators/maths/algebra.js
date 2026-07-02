// Algebra generator — solve linear equations, substitution, and nth-term of an
// arithmetic sequence.

const { randInt, pick } = require('../lib/random');
const { finalize } = require('../lib/assemble');

const SUBJECT = 'Maths';
const TOPIC = 'Algebra';

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

// ax + b = c  → solve for x (integer solutions)
function solveLinear(difficulty) {
  const a = randInt(2, difficulty === 'Hard' ? 9 : 5);
  const x = randInt(2, difficulty === 'Hard' ? 12 : 8);
  const b = randInt(1, difficulty === 'Hard' ? 20 : 10);
  const c = a * x + b;
  const answer = x;
  const distractors = intDistractors(answer, [
    c - b,            // forgot to divide
    Math.round(c / a), // forgot to subtract b
    x + 1, x - 1,
    Math.round((c + b) / a),
    a + b,
  ]);
  return finalize({
    subject: SUBJECT, topic: TOPIC, difficulty,
    question_text: `Solve for x: ${a}x + ${b} = ${c}.`,
    correct: answer,
    distractors,
    explanation: `Subtract ${b} from both sides: ${a}x = ${c - b}. Divide by ${a}: x = ${answer}.`,
  });
}

// Substitution: evaluate an expression at a given value.
function substitution(difficulty) {
  const a = randInt(2, 6);
  const b = randInt(1, 12);
  const x = randInt(2, difficulty === 'Hard' ? 10 : 6);
  const answer = a * x - b;
  const distractors = intDistractors(answer, [
    a * x + b, a + x - b, a * (x - b), a * x, answer + 1, answer - 2,
  ]);
  return finalize({
    subject: SUBJECT, topic: TOPIC, difficulty,
    question_text: `If x = ${x}, what is the value of ${a}x − ${b}?`,
    correct: answer,
    distractors,
    explanation: `${a} × ${x} = ${a * x}, then ${a * x} − ${b} = ${answer}.`,
  });
}

// nth term of an arithmetic sequence.
function nthTerm(difficulty) {
  const first = randInt(1, 9);
  const step = randInt(2, difficulty === 'Hard' ? 9 : 5);
  const n = randInt(difficulty === 'Hard' ? 8 : 4, difficulty === 'Hard' ? 15 : 8);
  const answer = first + (n - 1) * step;
  const seq = [0, 1, 2, 3].map((i) => first + i * step).join(', ');
  const distractors = intDistractors(answer, [
    first + n * step,          // used n instead of n-1
    first + (n - 1) * (step + 1),
    answer + step, answer - step, first * n,
  ]);
  return finalize({
    subject: SUBJECT, topic: TOPIC, difficulty,
    question_text: `A sequence starts ${seq}, ... What is the ${n}th term?`,
    correct: answer,
    distractors,
    explanation: `The rule adds ${step} each time. The ${n}th term is ${first} + (${n} − 1) × ${step} = ${answer}.`,
  });
}

const BY_DIFFICULTY = {
  Easy: [substitution, nthTerm],
  Medium: [solveLinear, substitution, nthTerm],
  Hard: [solveLinear, nthTerm],
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
