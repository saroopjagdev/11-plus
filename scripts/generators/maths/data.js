// Data Interpretation generator — a small textual table, then total / difference
// / mean questions computed exactly in code.

const { randInt, pick, shuffle } = require('../lib/random');
const { finalize } = require('../lib/assemble');

const SUBJECT = 'Maths';
const TOPIC = 'Data Interpretation';

const CONTEXTS = [
  { label: 'books read', items: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
  { label: 'goals scored', items: ['Team A', 'Team B', 'Team C', 'Team D'] },
  { label: 'points', items: ['Ava', 'Ben', 'Cara', 'Dan'] },
];

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

function generate(difficulty) {
  const ctx = pick(CONTEXTS);
  const n = ctx.items.length;
  const values = ctx.items.map(() => randInt(difficulty === 'Hard' ? 4 : 1, difficulty === 'Hard' ? 40 : 20));
  const table = ctx.items.map((it, i) => `${it}: ${values[i]}`).join(', ');

  const mode = pick(difficulty === 'Hard' ? ['total', 'mean', 'difference'] : ['total', 'difference']);
  let question_text;
  let answer;
  let explanation;

  if (mode === 'total') {
    answer = values.reduce((a, b) => a + b, 0);
    question_text = `The table shows ${ctx.label} — ${table}. What is the total?`;
    explanation = `Add every value: ${values.join(' + ')} = ${answer}.`;
  } else if (mode === 'difference') {
    const hi = Math.max(...values);
    const lo = Math.min(...values);
    answer = hi - lo;
    question_text = `The table shows ${ctx.label} — ${table}. What is the difference between the highest and lowest?`;
    explanation = `Highest is ${hi}, lowest is ${lo}: ${hi} − ${lo} = ${answer}.`;
  } else { // mean — force a whole-number mean
    const total = values.reduce((a, b) => a + b, 0);
    const remainder = total % n;
    if (remainder !== 0) values[0] += n - remainder; // nudge to divisible
    const adjTotal = values.reduce((a, b) => a + b, 0);
    answer = adjTotal / n;
    const adjTable = ctx.items.map((it, i) => `${it}: ${values[i]}`).join(', ');
    question_text = `The table shows ${ctx.label} — ${adjTable}. What is the mean (average)?`;
    explanation = `Add the values (${adjTotal}) and divide by ${n}: ${adjTotal} ÷ ${n} = ${answer}.`;
  }

  const distractors = intDistractors(answer, [
    answer + 1, answer - 1, answer + randInt(2, 8), answer - randInt(2, 6),
    Math.round(answer / 2), answer * 2,
  ]);

  return finalize({
    subject: SUBJECT, topic: TOPIC, difficulty,
    question_text,
    correct: answer,
    distractors,
    explanation,
  });
}

module.exports = { generate, TOPIC, SUBJECT };

if (require.main === module) {
  for (const d of ['Easy', 'Medium', 'Hard']) {
    console.log(`\n=== ${d} ===`);
    for (let i = 0; i < 5; i += 1) { const q = generate(d); if (q) console.log(`${q.question_text}\n   [${q.options.join(' | ')}]  ✓ ${q.correct_answer}`); }
  }
}
