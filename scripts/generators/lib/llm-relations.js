// Generates brand-new (word, [synonyms|antonyms]) entries to expand the
// Synonyms/Antonyms pools. An author pass proposes a target word plus 3
// candidate related words; each individual pair is then independently
// validated by reusing generateVerifiedExplanation from llm-explanation.js
// (if a fact-checked explanation for the pair can't be produced, the pair
// isn't a genuine synonym/antonym and is dropped). An entry is only kept if
// at least 2 of its 3 candidate pairs verify — same shape as the existing
// hand-authored data (2-4 related words per entry).

// Load env vars before requiring llm-explanation.js, which instantiates its
// own OpenAI client at module-load time and needs OPENAI_API_KEY to already
// be set by then, regardless of whether this file is the entry point.
require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env.local') });

const OpenAI = require('openai');
const { isCleanUKText } = require('./uk-english');
const { generateVerifiedExplanation } = require('./llm-explanation');

const MODEL = 'gpt-4o';
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const GRADE_LEVELS = {
  Easy: 'a Year 4 pupil (age 8-9)',
  Medium: 'a Year 5 pupil (age 9-10)',
  Hard: 'a Year 6 pupil (age 10-11)',
};

async function authorWordSet({ difficulty, relation, excludeWords }) {
  const grade = GRADE_LEVELS[difficulty] || GRADE_LEVELS.Medium;
  const exclude = excludeWords && excludeWords.length
    ? `\n\nDo NOT use any of these words as the target word: ${excludeWords.join(', ')}.`
    : '';

  const prompt = `You are creating a new UK 11+ verbal reasoning ${relation} question for ${grade}.

Pick ONE target English word suitable for this difficulty level, and list 3
genuine, single-word ${relation}s of it (real words a UK 11+ pupil should
recognise). Use British English spelling.${exclude}

Respond as valid JSON only, no markdown fences:
{ "word": "...", "${relation}s": ["...", "...", "..."] }`;

  const res = await client.chat.completions.create({
    model: MODEL,
    temperature: 0.9,
    response_format: { type: 'json_object' },
    messages: [{ role: 'user', content: prompt }],
  });

  return JSON.parse(res.choices[0].message.content);
}

// Author + verify a brand-new (word, [related...]) entry. Each candidate
// pair is checked independently via generateVerifiedExplanation (the same
// fact-checking verifier used for explanation enrichment); an entry is kept
// only if at least `minPairs` of its candidates verify.
async function generateVerifiedWordSet(
  { difficulty, relation, excludeWords = [] },
  { maxAttempts = 5, minPairs = 2 } = {},
) {
  const excludeLower = new Set(excludeWords.map((w) => w.toLowerCase()));
  const pairField = `${relation}s`;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    let raw;
    try {
      raw = await authorWordSet({ difficulty, relation, excludeWords });
    } catch (e) {
      continue;
    }

    const word = String(raw.word || '').trim();
    const candidates = Array.isArray(raw[pairField]) ? raw[pairField].map((w) => String(w).trim()) : [];
    if (!word || candidates.length < minPairs) continue;
    if (excludeLower.has(word.toLowerCase())) continue;
    if (!isCleanUKText(word) || candidates.some((c) => !isCleanUKText(c))) continue;

    const verifiedPairs = [];
    const explanations = {};
    for (const pair of candidates) {
      if (pair.toLowerCase() === word.toLowerCase()) continue;
      const explanation = await generateVerifiedExplanation({ word, pair, relation }, { maxAttempts: 2 });
      if (explanation) {
        verifiedPairs.push(pair);
        explanations[`${word.toLowerCase()}:${pair.toLowerCase()}`] = explanation;
      }
    }

    if (verifiedPairs.length >= minPairs) {
      return { word, [pairField]: verifiedPairs, difficulty, explanations };
    }
  }
  return null;
}

module.exports = { authorWordSet, generateVerifiedWordSet };

if (require.main === module) {
  (async () => {
    console.log(await generateVerifiedWordSet({ difficulty: 'Medium', relation: 'synonym', excludeWords: [] }));
  })();
}
