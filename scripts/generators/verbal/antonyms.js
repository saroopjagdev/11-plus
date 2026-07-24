// Antonyms — "which word means the opposite of X?". Same shape as synonyms.

const { pick, sample } = require('../lib/random');
const { finalize } = require('../lib/assemble');
const DATA = require('../../data/antonyms');
const EXPLANATIONS = require('../../data/antonym-explanations');

const SUBJECT = 'Verbal Reasoning';
const TOPIC = 'Antonyms';

const STEMS = [
  (w) => `Which word means the opposite of ${w.toUpperCase()}?`,
  (w) => `Choose the word most opposite in meaning to ${w.toUpperCase()}.`,
  (w) => `Select an antonym for ${w.toUpperCase()}.`,
  (w) => `Which of these words is most nearly opposite to ${w.toUpperCase()}?`,
];

function generate(difficulty) {
  const tier = DATA.filter((e) => e.difficulty === difficulty);
  if (tier.length < 3) return null;
  const entry = pick(tier);

  const correct = pick(entry.antonyms);
  const forbidden = new Set([entry.word.toLowerCase(), ...entry.antonyms.map((w) => w.toLowerCase())]);

  // Skip the whole entry (not just the shared word) if its antonym set
  // overlaps with this one's — e.g. two target words that share an antonym
  // are near-opposites of each other too, so a word drawn from that entry
  // could plausibly also be a correct answer here.
  const candidatePool = [];
  for (const e of DATA) {
    if (e === entry) continue;
    const eWords = new Set([e.word.toLowerCase(), ...e.antonyms.map((w) => w.toLowerCase())]);
    const overlaps = [...eWords].some((w) => forbidden.has(w));
    if (overlaps) continue;
    for (const w of [e.word, ...e.antonyms]) candidatePool.push(w);
  }
  const distractors = sample([...new Set(candidatePool)], 8);

  const richExplanation = EXPLANATIONS[`${entry.word.toLowerCase()}:${correct.toLowerCase()}`];

  return finalize({
    subject: SUBJECT, topic: TOPIC, difficulty,
    question_text: pick(STEMS)(entry.word),
    correct,
    distractors,
    explanation: richExplanation || `"${correct}" is the opposite of "${entry.word}".`,
  });
}

module.exports = { generate, TOPIC, SUBJECT };

if (require.main === module) {
  for (const d of ['Easy', 'Medium', 'Hard']) {
    console.log(`\n=== ${d} ===`);
    for (let i = 0; i < 4; i += 1) { const q = generate(d); if (q) console.log(`${q.question_text}  [${q.options.join(' | ')}]  ✓ ${q.correct_answer}`); }
  }
}
