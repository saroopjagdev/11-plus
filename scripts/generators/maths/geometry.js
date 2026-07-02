// Geometry generator — rectangle area/perimeter, triangle area, and angle sums.

const { randInt, pick } = require('../lib/random');
const { finalize } = require('../lib/assemble');

const SUBJECT = 'Maths';
const TOPIC = 'Geometry';

function intDistractors(correct, candidates) {
  const out = [];
  const seen = new Set([String(correct)]);
  for (const c of candidates) {
    if (!Number.isFinite(c) || c <= 0 || c === correct) continue;
    const t = String(c);
    if (seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

function rectangle(difficulty) {
  const w = randInt(2, difficulty === 'Hard' ? 20 : 12);
  const h = randInt(2, difficulty === 'Hard' ? 20 : 12);
  const wantArea = Math.random() < 0.5;
  const area = w * h;
  const perimeter = 2 * (w + h);
  const answer = wantArea ? area : perimeter;
  const distractors = intDistractors(answer, [
    wantArea ? perimeter : area, // swapped formula
    w + h, 2 * w + h, w * h + w, answer + w, answer - h,
  ]);
  return finalize({
    subject: SUBJECT, topic: TOPIC, difficulty,
    question_text: `A rectangle is ${w} cm by ${h} cm. What is its ${wantArea ? 'area, in square centimetres' : 'perimeter, in centimetres'}?`,
    correct: answer,
    distractors,
    explanation: wantArea
      ? `Area = length × width = ${w} × ${h} = ${area} cm².`
      : `Perimeter = 2 × (${w} + ${h}) = ${perimeter} cm.`,
  });
}

function triangleArea(difficulty) {
  const base = randInt(2, 20) * 2; // even so area is integer
  const height = randInt(2, difficulty === 'Hard' ? 20 : 12);
  const answer = (base * height) / 2;
  const distractors = intDistractors(answer, [
    base * height,      // forgot the ½
    base + height,
    answer + base, answer - height, (base * height) / 2 + 1,
  ]);
  return finalize({
    subject: SUBJECT, topic: TOPIC, difficulty,
    question_text: `A triangle has a base of ${base} cm and a height of ${height} cm. What is its area, in square centimetres?`,
    correct: answer,
    distractors,
    explanation: `Area of a triangle = ½ × base × height = ½ × ${base} × ${height} = ${answer} cm².`,
  });
}

function angles(difficulty) {
  const kind = pick(['triangle', 'line', 'quad']);
  const sum = kind === 'triangle' ? 180 : kind === 'line' ? 180 : 360;
  const parts = kind === 'quad' ? 3 : 2;
  const known = [];
  let remaining = sum;
  for (let i = 0; i < parts; i += 1) {
    const angle = randInt(30, Math.max(35, Math.floor(remaining / (parts - i)) - 10));
    known.push(angle);
    remaining -= angle;
  }
  const answer = remaining;
  if (answer <= 0) return null;
  const distractors = intDistractors(answer, [
    sum - answer, 180 - answer, answer + 10, answer - 10, sum,
  ]);
  const shape = kind === 'triangle' ? 'angles in a triangle'
    : kind === 'line' ? 'angles on a straight line' : 'angles in a quadrilateral';
  return finalize({
    subject: SUBJECT, topic: TOPIC, difficulty,
    question_text: `The ${shape} are ${known.join('°, ')}° and one more. What is the missing angle, in degrees?`,
    correct: answer,
    distractors,
    explanation: `The ${shape} add up to ${sum}°. ${sum} − (${known.join(' + ')}) = ${answer}°.`,
  });
}

const BY_DIFFICULTY = {
  Easy: [rectangle, angles],
  Medium: [rectangle, triangleArea, angles],
  Hard: [triangleArea, angles, rectangle],
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
