// Fractions generator. Every answer is computed with exact rational arithmetic
// (see lib/fractions.js) and every distractor is checked to be a DIFFERENT VALUE
// from the answer via cross-multiplication — so "5/6 − 3/6 = 1/6" and
// "3/4 = 6/8 and 9/12 both correct" cannot occur.

const F = require('../lib/fractions');
const { randInt, pick, shuffle } = require('../lib/random');
const { finalize } = require('../lib/assemble');

const SUBJECT = 'Maths';
const TOPIC = 'Fractions';

// Safe fraction builder for DISTRACTOR candidates: returns null instead of
// throwing when arithmetic yields a non-integer or non-positive denominator, so
// invalid candidates are simply skipped rather than crashing the run.
function sf(n, d) {
  if (!Number.isInteger(n) || !Number.isInteger(d) || d <= 0 || n < 0) return null;
  return { n, d };
}

// Turn candidate fraction objects into simplest-form text distractors that are
// guaranteed value-distinct from the answer (and each other).
function fractionDistractors(correct, candidates) {
  const out = [];
  const seen = new Set([F.toText(correct)]);
  for (const c of candidates) {
    if (!c || c.d === 0 || c.n <= 0) continue; // skip invalid and zero-valued
    if (F.equals(c, correct)) continue; // never a second correct answer
    const text = F.toText(F.simplify(c));
    if (seen.has(text)) continue;
    seen.add(text);
    out.push(text);
  }
  return out;
}

function intDistractors(correct, candidates) {
  const out = [];
  const seen = new Set([String(correct)]);
  for (const c of candidates) {
    if (!Number.isFinite(c) || c < 0 || c === correct) continue;
    const text = String(c);
    if (seen.has(text)) continue;
    seen.add(text);
    out.push(text);
  }
  return out;
}

// --- sub-types -------------------------------------------------------------

// "What is 2/5 of 30?" — integer answer.
function ofAmount(difficulty) {
  const denom = pick(difficulty === 'Easy' ? [2, 3, 4, 5] : [3, 4, 5, 6, 8]);
  const numer = difficulty === 'Easy' ? 1 : randInt(2, denom - 1);
  const multiplier = randInt(difficulty === 'Hard' ? 6 : 2, difficulty === 'Hard' ? 15 : 9);
  const whole = denom * multiplier; // divisible, clean answer
  const answer = (whole / denom) * numer;

  const distractors = intDistractors(answer, [
    whole / denom,                 // forgot to multiply by the numerator
    (whole / denom) * (numer + 1), // off-by-one numerator
    whole - answer,                // took the complement
    Math.round(whole / numer),     // divided by the numerator instead
    answer + denom,
    answer - numer,
  ]);

  return finalize({
    subject: SUBJECT, topic: TOPIC, difficulty,
    question_text: `What is ${numer}/${denom} of ${whole}?`,
    correct: answer,
    distractors,
    explanation: `Divide ${whole} by ${denom} to get ${whole / denom}, then multiply by ${numer}: ${whole / denom} × ${numer} = ${answer}.`,
  });
}

// "Which of these fractions is the largest?" — five distinct values.
function largestOf(difficulty) {
  const denomPool = difficulty === 'Hard' ? [3, 4, 5, 6, 8, 10] : [2, 3, 4, 5, 6];
  const fractions = [];
  const seenVals = new Set();
  let guard = 0;
  while (fractions.length < 5 && guard++ < 200) {
    const d = pick(denomPool);
    const n = randInt(1, d - 1);
    const fr = F.simplify(F.makeFraction(n, d));
    const key = fr.n / fr.d;
    if (seenVals.has(key)) continue;
    seenVals.add(key);
    fractions.push(fr);
  }
  if (fractions.length < 5) return null;

  const largest = fractions.reduce((a, b) => (a.n / a.d >= b.n / b.d ? a : b));
  const options = fractions.map(F.toText);

  // Here the five fractions ARE the options; hand them straight through by
  // making the "distractors" the other four.
  const distractors = options.filter((o) => o !== F.toText(largest));

  return finalize({
    subject: SUBJECT, topic: TOPIC, difficulty,
    question_text: `Which of these fractions is the largest?`,
    correct: F.toText(largest),
    distractors,
    explanation: `Comparing the fractions, ${F.toText(largest)} has the greatest value.`,
  });
}

// "Write 8/12 in its simplest form."
function simplify(difficulty) {
  const base = F.simplify(F.makeFraction(randInt(1, 4), pick([2, 3, 4, 5])));
  const factor = randInt(2, difficulty === 'Hard' ? 6 : 4);
  const shown = F.makeFraction(base.n * factor, base.d * factor);
  const answer = F.simplify(shown);
  if (F.equals(shown, answer) && shown.d === answer.d) return null; // already simplest

  const distractors = fractionDistractors(answer, [
    sf(shown.n / 2, shown.d),      // halved numerator only
    sf(shown.n, shown.d / 2),      // halved denominator only
    sf(answer.n + 1, answer.d),
    sf(answer.n, answer.d + 1),
    sf(shown.n - factor, shown.d - factor),
  ]);

  return finalize({
    subject: SUBJECT, topic: TOPIC, difficulty,
    question_text: `Write ${F.toText(shown)} in its simplest form.`,
    correct: F.toText(answer),
    distractors,
    explanation: `Divide the top and bottom by ${F.gcd(shown.n, shown.d)}: ${F.toText(shown)} = ${F.toText(answer)}.`,
  });
}

// Add or subtract, answer in simplest form.
function addSub(difficulty) {
  const sameDenom = difficulty !== 'Hard';
  const d1 = pick([2, 3, 4, 5, 6, 8]);
  const d2 = sameDenom ? d1 : pick([2, 3, 4, 5, 6, 8].filter((x) => x !== d1));
  const isAdd = Math.random() < 0.5;

  let a = F.makeFraction(randInt(1, d1 - 1), d1);
  let b = F.makeFraction(randInt(1, d2 - 1), d2);
  if (!isAdd && a.n / a.d < b.n / b.d) [a, b] = [b, a]; // keep subtraction positive

  const answer = isAdd ? F.add(a, b) : F.subtract(a, b);
  if (answer.n <= 0) return null;

  const wrongCommon = sf(
    isAdd ? a.n + b.n : a.n - b.n,
    isAdd ? a.d + b.d : a.d, // classic error: operate on denominators / ignore
  );
  const distractors = fractionDistractors(answer, [
    wrongCommon,
    isAdd ? F.subtract(a, b) : F.add(a, b),      // wrong operation
    sf(answer.n + 1, answer.d),
    sf(answer.n, answer.d + 1),
    sf(a.n + b.n, Math.max(a.d, b.d)),
  ]);

  return finalize({
    subject: SUBJECT, topic: TOPIC, difficulty,
    question_text: `Work out ${F.toText(a)} ${isAdd ? '+' : '−'} ${F.toText(b)}. Give your answer in its simplest form.`,
    correct: F.toText(answer),
    distractors,
    explanation: sameDenom
      ? `The denominators match, so ${isAdd ? 'add' : 'subtract'} the numerators: ${a.n} ${isAdd ? '+' : '−'} ${b.n} over ${d1}, which simplifies to ${F.toText(answer)}.`
      : `Use a common denominator of ${a.d * b.d}, ${isAdd ? 'add' : 'subtract'}, then simplify to ${F.toText(answer)}.`,
  });
}

// "Which fraction is equal to 3/4?" — only one option is equivalent by check.
function equivalent(difficulty) {
  const base = F.simplify(F.makeFraction(randInt(1, 5), pick([2, 3, 4, 5, 6])));
  const factor = randInt(2, difficulty === 'Hard' ? 6 : 4);
  const answer = F.makeFraction(base.n * factor, base.d * factor);

  const distractors = fractionDistractors(answer, [
    sf(base.n * factor + 1, base.d * factor),
    sf(base.n * factor, base.d * factor + 1),
    sf(base.n + factor, base.d + factor),
    sf(base.n * (factor + 1), base.d * factor),
    sf(base.d * factor, base.n * factor), // inverted
  ]).filter((t) => t !== F.toText(base)); // don't offer the base itself

  return finalize({
    subject: SUBJECT, topic: TOPIC, difficulty,
    question_text: `Which of these fractions is equal to ${F.toText(base)}?`,
    correct: F.toText(answer),
    distractors,
    explanation: `Multiply top and bottom of ${F.toText(base)} by ${factor}: ${F.toText(answer)}. The others do not simplify to ${F.toText(base)}.`,
  });
}

// "3/4 of a number is 18. What is the number?" (Hard, reverse).
function reverseOfAmount(difficulty) {
  const denom = pick([3, 4, 5, 6, 8]);
  const numer = randInt(2, denom - 1);
  const part = numer * randInt(2, 9); // divisible by numer
  const whole = (part / numer) * denom;
  const answer = whole;

  const distractors = intDistractors(answer, [
    part * numer,
    Math.round((part / denom) * numer),
    part + denom,
    (part / numer) * (denom - 1),
    part * denom,
  ]);

  return finalize({
    subject: SUBJECT, topic: TOPIC, difficulty,
    question_text: `${numer}/${denom} of a number is ${part}. What is the number?`,
    correct: answer,
    distractors,
    explanation: `${numer}/${denom} is ${part}, so 1/${denom} is ${part / numer}. Multiply by ${denom}: ${answer}.`,
  });
}

const BY_DIFFICULTY = {
  Easy: [ofAmount, largestOf, simplify],
  Medium: [addSub, equivalent, ofAmount, simplify],
  Hard: [addSub, reverseOfAmount, equivalent, largestOf],
};

function generate(difficulty) {
  const pool = BY_DIFFICULTY[difficulty] || BY_DIFFICULTY.Medium;
  // A few attempts in case a sub-type returns null (e.g. already-simplest).
  for (let i = 0; i < 6; i += 1) {
    const q = pick(pool)(difficulty);
    if (q) return q;
  }
  return null;
}

module.exports = { generate, TOPIC, SUBJECT };

// Sample harness: `node scripts/generators/maths/fractions.js`
if (require.main === module) {
  for (const d of ['Easy', 'Medium', 'Hard']) {
    console.log(`\n=== ${d} ===`);
    for (let i = 0; i < 6; i += 1) {
      const q = generate(d);
      if (q) console.log(`${q.question_text}  [${q.options.join(' | ')}]  ✓ ${q.correct_answer}\n   ${q.explanation}`);
    }
  }
}
