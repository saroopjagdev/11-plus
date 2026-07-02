// Decimals generator — place value, ×/÷ by 10/100, rounding, ordering.

const { randInt, pick, shuffle } = require('../lib/random');
const { finalize } = require('../lib/assemble');

const SUBJECT = 'Maths';
const TOPIC = 'Decimals';

function textDistractors(correct, candidates) {
  const out = [];
  const seen = new Set([correct]);
  for (const c of candidates) {
    const t = String(c);
    if (t === 'NaN' || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

const fmt = (x) => Number(x.toFixed(3)).toString();

function multDivPower(difficulty) {
  const value = randInt(1, 999) / pick([10, 100]);
  const power = pick(difficulty === 'Hard' ? [10, 100, 1000] : [10, 100]);
  const isMult = Math.random() < 0.5;
  const answer = isMult ? value * power : value / power;
  const distractors = textDistractors(fmt(answer), [
    fmt(isMult ? value / power : value * power), // wrong direction
    fmt(isMult ? value * (power * 10) : value / (power * 10)),
    fmt(value * (isMult ? power / 10 : 1)),
    fmt(answer * 10), fmt(answer / 10),
  ]);
  return finalize({
    subject: SUBJECT, topic: TOPIC, difficulty,
    question_text: `Work out ${fmt(value)} ${isMult ? '×' : '÷'} ${power}.`,
    correct: fmt(answer),
    distractors,
    explanation: `${isMult ? 'Multiplying' : 'Dividing'} by ${power} moves the digits ${Math.log10(power)} place(s) to the ${isMult ? 'left' : 'right'}: ${fmt(answer)}.`,
  });
}

function rounding(difficulty) {
  const value = randInt(1000, 99999) / 100; // two decimal places
  const dp = pick(difficulty === 'Hard' ? [0, 1] : [0, 1]);
  const factor = 10 ** dp;
  const answer = Math.round(value * factor) / factor;
  const distractors = textDistractors(fmt(answer), [
    fmt(Math.floor(value * factor) / factor),
    fmt(Math.ceil(value * factor) / factor),
    fmt(answer + 1 / factor), fmt(answer - 1 / factor),
    fmt(Math.round(value)),
  ]);
  return finalize({
    subject: SUBJECT, topic: TOPIC, difficulty,
    question_text: `Round ${fmt(value)} to ${dp === 0 ? 'the nearest whole number' : '1 decimal place'}.`,
    correct: fmt(answer),
    distractors,
    explanation: `Look at the digit after the ${dp === 0 ? 'decimal point' : 'first decimal place'} to decide whether to round up or down: ${fmt(answer)}.`,
  });
}

function ordering(difficulty) {
  const vals = [];
  const seen = new Set();
  while (vals.length < 5) {
    const v = randInt(10, 999) / 100;
    if (seen.has(v)) continue;
    seen.add(v);
    vals.push(v);
  }
  const wantLargest = Math.random() < 0.5;
  const answer = wantLargest ? Math.max(...vals) : Math.min(...vals);
  const options = vals.map(fmt);
  return finalize({
    subject: SUBJECT, topic: TOPIC, difficulty,
    question_text: `Which of these decimals is the ${wantLargest ? 'largest' : 'smallest'}?`,
    correct: fmt(answer),
    distractors: options.filter((o) => o !== fmt(answer)),
    explanation: `Comparing place value, ${fmt(answer)} is the ${wantLargest ? 'largest' : 'smallest'}.`,
  });
}

const BY_DIFFICULTY = {
  Easy: [multDivPower, ordering],
  Medium: [multDivPower, rounding, ordering],
  Hard: [multDivPower, rounding],
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
