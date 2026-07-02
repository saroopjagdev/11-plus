// Anagrams — unscramble the letters to find a real word. The answer is the
// original word; distractors are other real words of the same length that are
// NOT anagrams of the scramble.

const { pick, shuffle, sample } = require('../lib/random');
const { finalize } = require('../lib/assemble');
const { commonWords } = require('../../data/words');

const SUBJECT = 'Verbal Reasoning';
const TOPIC = 'Anagrams';

function scramble(word) {
  let s = word;
  let guard = 0;
  while (s === word && guard++ < 20) s = shuffle(word.split('')).join('');
  return s.toUpperCase();
}

const sortLetters = (w) => w.toUpperCase().split('').sort().join('');

function generate(difficulty) {
  const tier = commonWords[difficulty] || commonWords.Medium;
  const word = pick(tier);
  const scrambled = scramble(word);
  const answerKey = sortLetters(word);

  // Distractors: same-length words that are not anagrams of the scramble.
  const distractors = sample(
    tier.filter((w) => w.length === word.length && sortLetters(w) !== answerKey),
    8,
  ).map((w) => w.toLowerCase());
  if (distractors.length < 4) {
    // borrow from other tiers if needed
    const extra = [].concat(...Object.values(commonWords))
      .filter((w) => w.length === word.length && sortLetters(w) !== answerKey);
    distractors.push(...sample(extra, 8).map((w) => w.toLowerCase()));
  }

  return finalize({
    subject: SUBJECT, topic: TOPIC, difficulty,
    question_text: `Rearrange the letters ${scrambled} to make a real word. Which is it?`,
    correct: word.toLowerCase(),
    distractors,
    explanation: `The letters of ${scrambled} rearrange to spell "${word}".`,
  });
}

module.exports = { generate, TOPIC, SUBJECT };

if (require.main === module) {
  for (const d of ['Easy', 'Medium', 'Hard']) {
    console.log(`\n=== ${d} ===`);
    for (let i = 0; i < 4; i += 1) { const q = generate(d); if (q) console.log(`${q.question_text}  [${q.options.join(' | ')}]  ✓ ${q.correct_answer}`); }
  }
}
