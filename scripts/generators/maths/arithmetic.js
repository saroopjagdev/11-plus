// Arithmetic generator — whole-number four operations, BODMAS, factors/multiples.
// All answers computed directly in code.

const { randInt, pick } = require('../lib/random');
const { finalize } = require('../lib/assemble');

const SUBJECT = 'Maths';
const TOPIC = 'Arithmetic';

function intDistractors(correct, candidates) {
  const out = [];
  const seen = new Set([String(correct)]);
  for (const c of candidates) {
    if (!Number.isFinite(c) || c < 0 || c === correct) continue;
    const t = String(c);
    if (seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

function rangeFor(difficulty) {
  if (difficulty === 'Easy') return [2, 20];
  if (difficulty === 'Medium') return [10, 99];
  return [25, 250];
}

// a op b
function twoOperand(difficulty) {
  const [lo, hi] = rangeFor(difficulty);
  const op = pick(difficulty === 'Easy' ? ['+', '−', '×'] : ['+', '−', '×', '÷']);
  let a = randInt(lo, hi);
  let b = randInt(lo, hi);
  let answer;

  if (op === '+') answer = a + b;
  else if (op === '−') { if (a < b) [a, b] = [b, a]; answer = a - b; }
  else if (op === '×') {
    a = randInt(...(difficulty === 'Hard' ? [12, 25] : [2, 12]));
    b = randInt(...(difficulty === 'Hard' ? [12, 25] : [2, 12]));
    answer = a * b;
  } else { // ÷ — build from a product so it divides cleanly
    b = randInt(2, 12);
    answer = randInt(2, difficulty === 'Hard' ? 20 : 12);
    a = b * answer;
  }

  const distractors = intDistractors(answer, [
    answer + 1, answer - 1, answer + 10, answer - 10,
    op === '×' ? a + b : a * b,
    op === '+' ? a - b : a + b,
    answer + randInt(2, 9), answer - randInt(2, 9),
  ]);

  return finalize({
    subject: SUBJECT, topic: TOPIC, difficulty,
    question_text: `Work out ${a} ${op} ${b}.`,
    correct: answer,
    distractors,
    explanation: `${a} ${op} ${b} = ${answer}.`,
  });
}

// BODMAS: a + b × c  (Medium/Hard)
function orderOfOps(difficulty) {
  const a = randInt(2, 20);
  const b = randInt(2, 12);
  const c = randInt(2, 12);
  const answer = a + b * c;
  const distractors = intDistractors(answer, [
    (a + b) * c,       // ignored BODMAS
    a + b + c,
    a * b + c,
    answer + 1, answer - 1, b * c,
  ]);
  return finalize({
    subject: SUBJECT, topic: TOPIC, difficulty,
    question_text: `Work out ${a} + ${b} × ${c}.`,
    correct: answer,
    distractors,
    explanation: `Multiplication comes first: ${b} × ${c} = ${b * c}, then ${a} + ${b * c} = ${answer}.`,
  });
}

// Factors / multiples
function factorsMultiples(difficulty) {
  const isFactor = Math.random() < 0.5;
  if (isFactor) {
    const n = pick([12, 18, 24, 36, 48, 60]);
    const factors = [];
    for (let i = 1; i <= n; i += 1) if (n % i === 0) factors.push(i);
    const answer = pick(factors.filter((f) => f !== 1 && f !== n));
    const nonFactors = [];
    for (let i = 2; i < n; i += 1) if (n % i !== 0) nonFactors.push(i);
    return finalize({
      subject: SUBJECT, topic: TOPIC, difficulty,
      question_text: `Which of these is a factor of ${n}?`,
      correct: answer,
      distractors: intDistractors(answer, nonFactors),
      explanation: `${answer} divides into ${n} exactly (${n} ÷ ${answer} = ${n / answer}), so it is a factor.`,
    });
  }
  const base = randInt(3, 9);
  const k = randInt(3, 9);
  const answer = base * k;
  const nonMultiples = [answer + 1, answer - 1, answer + 2, base * k + base - 1, answer + 3];
  return finalize({
    subject: SUBJECT, topic: TOPIC, difficulty,
    question_text: `Which of these is a multiple of ${base}?`,
    correct: answer,
    distractors: intDistractors(answer, nonMultiples.filter((x) => x % base !== 0)),
    explanation: `${answer} = ${base} × ${k}, so it is a multiple of ${base}.`,
  });
}

const BY_DIFFICULTY = {
  Easy: [twoOperand, factorsMultiples],
  Medium: [twoOperand, orderOfOps, factorsMultiples],
  Hard: [twoOperand, orderOfOps],
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
    for (let i = 0; i < 6; i += 1) {
      const q = generate(d);
      if (q) console.log(`${q.question_text}  [${q.options.join(' | ')}]  ✓ ${q.correct_answer}`);
    }
  }
}
