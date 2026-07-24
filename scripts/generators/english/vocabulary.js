// Vocabulary in context — "which is the closest meaning of X?". Vetted meaning
// + tempting-but-wrong distractors from the data file.

const { pick } = require('../lib/random');
const { finalize } = require('../lib/assemble');
const DATA = require('../../data/vocabulary');

const SUBJECT = 'English';
const TOPIC = 'Vocabulary';

// Definitional stems — tested in isolation, no sentence needed.
const DEFINITION_STEMS = [
  (w) => `What does the word "${w}" mean?`,
  (w) => `Which meaning best matches the word "${w}"?`,
];

// Sentence-context stems — match real GL Assessment vocabulary questions,
// which show the word in a sentence and test contextual understanding
// rather than pure dictionary recall. Requires entry.sentence.
const CONTEXT_STEMS = [
  (w, s) => `Read this sentence: "${s}"\n\nWhat does "${w}" mean in this sentence?`,
  (w, s) => `"${s}"\n\nChoose the meaning of "${w}" as it is used above.`,
  (w, s) => `In the sentence "${s}", what is the meaning of "${w}"?`,
];

function generate(difficulty) {
  const tier = DATA.filter((e) => e.difficulty === difficulty);
  const entry = pick(tier.length ? tier : DATA);
  if (entry.distractors.length < 3) return null;

  // Bias toward sentence-context stems when a sentence is available (the
  // actual fix for testing contextual understanding instead of bare
  // recall); fall back to definitional-only for any entry that somehow
  // lacks one.
  const hasSentence = typeof entry.sentence === 'string' && entry.sentence.trim().length > 0;
  const stemPool = hasSentence ? [...CONTEXT_STEMS, ...CONTEXT_STEMS, ...DEFINITION_STEMS] : DEFINITION_STEMS;
  const stem = pick(stemPool);
  const question_text = hasSentence ? stem(entry.word, entry.sentence.trim()) : stem(entry.word);

  const explanation = hasSentence
    ? `In the sentence "${entry.sentence.trim()}", "${entry.word}" means "${entry.meaning}".`
    : `"${entry.word}" means "${entry.meaning}".`;

  return finalize({
    subject: SUBJECT, topic: TOPIC, difficulty,
    question_text,
    correct: entry.meaning,
    distractors: entry.distractors,
    explanation,
    example_sentence: hasSentence ? entry.sentence.trim() : undefined,
  });
}

module.exports = { generate, TOPIC, SUBJECT };

if (require.main === module) {
  for (const d of ['Easy', 'Medium', 'Hard']) {
    console.log(`\n=== ${d} ===`);
    for (let i = 0; i < 3; i += 1) { const q = generate(d); if (q) console.log(`${q.question_text}  [${q.options.join(' | ')}]  ✓ ${q.correct_answer}`); }
  }
}
