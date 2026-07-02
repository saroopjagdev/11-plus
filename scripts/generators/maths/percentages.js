// Percentages generator — % of amount, increase/decrease, and reverse %
// (the genuine Hard-tier problems that make the bank feel 11+).

const { randInt, pick } = require('../lib/random');
const { finalize } = require('../lib/assemble');

const SUBJECT = 'Maths';
const TOPIC = 'Percentages';

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

function percentOf(difficulty) {
  const pct = pick(difficulty === 'Easy' ? [10, 25, 50] : difficulty === 'Medium' ? [10, 20, 25, 40, 75] : [15, 30, 35, 60, 80]);
  const whole = cleanBaseFor(pct, difficulty); // divisible so the answer is a clean integer
  const answer = (whole * pct) / 100;
  const distractors = intDistractors(answer, [
    whole - answer,
    (whole * (pct + 10)) / 100,
    (whole * (pct - 10)) / 100,
    answer + whole / 10,
    answer * 2,
    whole / pct,
  ]);
  return finalize({
    subject: SUBJECT, topic: TOPIC, difficulty,
    question_text: `What is ${pct}% of ${whole}?`,
    correct: answer,
    distractors,
    explanation: `${pct}% = ${pct}/100, so ${pct}% of ${whole} = ${whole} × ${pct} ÷ 100 = ${answer}.`,
  });
}

function increaseDecrease(difficulty) {
  const pct = pick([10, 20, 25, 50]);
  const whole = cleanBaseFor(pct, difficulty);
  const isIncrease = Math.random() < 0.5;
  const change = (whole * pct) / 100;
  const answer = isIncrease ? whole + change : whole - change;
  const distractors = intDistractors(answer, [
    isIncrease ? whole - change : whole + change, // wrong direction
    change,                                       // just the change
    whole,                                        // forgot to apply
    isIncrease ? whole + change * 2 : whole - change * 2,
    answer + whole / 10,
  ]);
  return finalize({
    subject: SUBJECT, topic: TOPIC, difficulty,
    question_text: `A price of £${whole} is ${isIncrease ? 'increased' : 'decreased'} by ${pct}%. What is the new price, in pounds?`,
    correct: answer,
    distractors,
    explanation: `${pct}% of £${whole} is £${change}. ${isIncrease ? 'Add' : 'Subtract'} it: £${whole} ${isIncrease ? '+' : '−'} £${change} = £${answer}.`,
  });
}

// Reverse percentage — a real Hard 11+ type.
function reversePercent(difficulty) {
  const pct = pick([20, 25, 10, 50]);
  const original = cleanBaseFor(pct, 'Medium');
  const isIncrease = Math.random() < 0.5;
  const finalPrice = isIncrease
    ? original + (original * pct) / 100
    : original - (original * pct) / 100;
  const answer = original;
  const distractors = intDistractors(answer, [
    isIncrease ? finalPrice + (finalPrice * pct) / 100 : finalPrice - (finalPrice * pct) / 100,
    finalPrice,
    finalPrice + (original * pct) / 100,
    finalPrice - (original * pct) / 100 + 1,
    Math.round(finalPrice / (isIncrease ? 1.1 : 0.9)),
  ]);
  return finalize({
    subject: SUBJECT, topic: TOPIC, difficulty,
    question_text: `After ${isIncrease ? 'a' : 'a'} ${pct}% ${isIncrease ? 'increase' : 'discount'}, an item costs £${finalPrice}. What was the original price, in pounds?`,
    correct: answer,
    distractors,
    explanation: `£${finalPrice} represents ${isIncrease ? 100 + pct : 100 - pct}% of the original. Divide by ${isIncrease ? 100 + pct : 100 - pct} and multiply by 100: £${answer}.`,
  });
}

// Helpers
function gcd(a, b) { while (b) { [a, b] = [b, a % b]; } return a || 1; }
function cleanBaseFor(pct, difficulty) {
  // choose a whole so that pct% is an integer
  const unit = 100 / gcd(pct, 100); // smallest whole giving integer percent
  const mult = randInt(difficulty === 'Hard' ? 3 : 2, difficulty === 'Hard' ? 12 : 8);
  return unit * mult;
}

const BY_DIFFICULTY = {
  Easy: [percentOf],
  Medium: [percentOf, increaseDecrease],
  Hard: [increaseDecrease, reversePercent, percentOf],
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
