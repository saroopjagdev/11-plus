// Two-pass LLM authoring for Vocabulary example sentences: an author pass
// drafts a sentence that uses the target word in context, then an
// independent verifier pass (no hints about which option is "correct")
// checks that the word's meaning is genuinely inferable from that sentence
// before it's accepted. This verifier pass is the quality gate in place of
// manual review — same author+verifier shape as scripts/generators/comprehension.js.

const OpenAI = require('openai');
const { isCleanUKText } = require('./uk-english');
const { shuffle } = require('./random');

if (require.main === module) {
  require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env.local') });
}

const MODEL = 'gpt-4o';
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const GRADE_LEVELS = {
  Easy: 'a Year 4 pupil (age 8-9)',
  Medium: 'a Year 5 pupil (age 9-10)',
  Hard: 'a Year 6 pupil (age 10-11)',
};

async function authorSentence({ word, meaning, difficulty }) {
  const grade = GRADE_LEVELS[difficulty] || GRADE_LEVELS.Medium;

  const prompt = `You are writing a UK 11+ exam vocabulary-in-context question for ${grade}.

Word: "${word}"
Meaning: "${meaning}"

Write ONE natural sentence (12-22 words) that uses the word "${word}" in a way
that makes its meaning inferable from context, WITHOUT using any synonym of
the word or otherwise stating the meaning directly in the sentence. Use
British English spelling. The sentence should be age-appropriate and about an
everyday or school-relevant topic.

Respond as valid JSON only, no markdown fences:
{ "sentence": "..." }`;

  const res = await client.chat.completions.create({
    model: MODEL,
    temperature: 0.7,
    response_format: { type: 'json_object' },
    messages: [{ role: 'user', content: prompt }],
  });

  const parsed = JSON.parse(res.choices[0].message.content);
  return String(parsed.sentence || '').trim();
}

// Independent check: given only the sentence (no meaning hint), can a fresh
// LLM call correctly pick the target meaning out of the real option set?
async function verifySentence({ word, meaning, sentence, distractors }) {
  const options = shuffle([meaning, ...distractors]);
  const optList = options.map((o, i) => `${String.fromCharCode(65 + i)}) ${o}`).join('\n');

  const prompt = `Read the sentence below. Based ONLY on how the word "${word}" is used in
the sentence, choose which option best matches its meaning there.

SENTENCE: ${sentence}

OPTIONS:
${optList}

Reply with ONLY the letter of the best answer. Nothing else.`;

  const res = await client.chat.completions.create({
    model: MODEL,
    temperature: 0,
    messages: [{ role: 'user', content: prompt }],
  });

  const letter = res.choices[0].message.content.trim().toUpperCase();
  const idx = letter.charCodeAt(0) - 65;
  if (idx < 0 || idx >= options.length) return false;
  return options[idx] === meaning;
}

// Author + verify, retrying on rejection. Returns a verified sentence string
// or null if no attempt passed within maxAttempts.
async function generateVerifiedSentence({ word, meaning, distractors, difficulty }, { maxAttempts = 4 } = {}) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    let sentence;
    try {
      sentence = await authorSentence({ word, meaning, difficulty });
    } catch (e) {
      continue;
    }

    if (!sentence || sentence.length < 5 || sentence.length > 200) continue;
    if (!isCleanUKText(sentence)) continue;
    if (!sentence.toLowerCase().includes(word.toLowerCase())) continue;

    try {
      const verified = await verifySentence({ word, meaning, sentence, distractors });
      if (verified) return sentence;
    } catch (e) {
      continue;
    }
  }
  return null;
}

// Author pass for a brand-new vocabulary word (not a sentence for an
// existing one) — used to expand the pool. Produces word + meaning +
// distractors + sentence all at once.
async function authorNewWord({ difficulty, excludeWords }) {
  const grade = GRADE_LEVELS[difficulty] || GRADE_LEVELS.Medium;
  const exclude = excludeWords && excludeWords.length
    ? `\n\nDo NOT use any of these words (already in the question bank): ${excludeWords.join(', ')}.`
    : '';

  const prompt = `You are creating a new UK 11+ exam vocabulary question for ${grade}.

Pick ONE real English word suitable for this difficulty level, along with:
- a concise, child-friendly definition
- 4 plausible-but-wrong alternative definitions (distractors) — tempting,
  same register as the real one, not obviously silly or unrelated
- ONE natural sentence (12-22 words) using the word so its meaning is
  inferable from context, without stating the meaning directly or using a
  synonym of the word

Use British English spelling throughout.${exclude}

Respond as valid JSON only, no markdown fences:
{ "word": "...", "meaning": "...", "distractors": ["...", "...", "...", "..."], "sentence": "..." }`;

  const res = await client.chat.completions.create({
    model: MODEL,
    temperature: 0.9,
    response_format: { type: 'json_object' },
    messages: [{ role: 'user', content: prompt }],
  });

  return JSON.parse(res.choices[0].message.content);
}

// Author + verify a brand-new word entry, retrying on rejection. Reuses
// verifySentence as the same quality gate used for backfilled sentences —
// if a fresh model call can't correctly infer the meaning from the
// generated sentence alone, the whole candidate is discarded.
async function generateVerifiedNewWord({ difficulty, excludeWords = [] }, { maxAttempts = 5 } = {}) {
  const excludeLower = new Set(excludeWords.map((w) => w.toLowerCase()));

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    let raw;
    try {
      raw = await authorNewWord({ difficulty, excludeWords });
    } catch (e) {
      continue;
    }

    const word = String(raw.word || '').trim();
    const meaning = String(raw.meaning || '').trim();
    const distractors = Array.isArray(raw.distractors) ? raw.distractors.map((d) => String(d).trim()) : [];
    const sentence = String(raw.sentence || '').trim();

    if (!word || !meaning || distractors.length < 4 || !sentence) continue;
    if (excludeLower.has(word.toLowerCase())) continue;
    if (sentence.length < 5 || sentence.length > 200) continue;
    if (!isCleanUKText(word) || !isCleanUKText(meaning) || !isCleanUKText(sentence)) continue;
    if (distractors.some((d) => !isCleanUKText(d))) continue;
    if (!sentence.toLowerCase().includes(word.toLowerCase())) continue;

    try {
      const verified = await verifySentence({ word, meaning, sentence, distractors });
      if (verified) return { word, meaning, distractors, sentence, difficulty };
    } catch (e) {
      continue;
    }
  }
  return null;
}

module.exports = {
  authorSentence,
  verifySentence,
  generateVerifiedSentence,
  authorNewWord,
  generateVerifiedNewWord,
};

if (require.main === module) {
  (async () => {
    const samples = [
      { word: 'timid', meaning: 'shy and easily frightened', distractors: ['very tall', 'extremely loud', 'brightly coloured', 'unusually strong'], difficulty: 'Easy' },
      { word: 'meticulous', meaning: 'showing great attention to detail', distractors: ['careless and rushed', 'loud and cheerful', 'shy and quiet', 'fast and reckless'], difficulty: 'Hard' },
    ];
    for (const s of samples) {
      const sentence = await generateVerifiedSentence(s);
      console.log(`${s.word} (${s.difficulty}): ${sentence || 'FAILED to verify'}`);
    }
  })();
}
