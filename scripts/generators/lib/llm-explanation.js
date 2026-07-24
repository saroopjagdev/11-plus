// Two-pass LLM authoring for richer Synonym/Antonym explanations: an author
// pass writes a short explanation of why two words are synonyms/antonyms
// (not just restating the relationship), then an independent verifier pass
// fact-checks the claim before acceptance. Same author+verifier shape as
// llm-vocabulary.js / comprehension.js — the quality gate in place of
// manual review.

const OpenAI = require('openai');
const { isCleanUKText } = require('./uk-english');

if (require.main === module) {
  require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env.local') });
}

const MODEL = 'gpt-4o';
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function authorExplanation({ word, pair, relation }) {
  const relLabel = relation === 'synonym' ? 'means the same as' : 'is the opposite of';

  const prompt = `Write ONE short, simple explanation (max 25 words) for a UK 11+ pupil
(age 9-11) of why "${pair}" ${relLabel} "${word}". Do not just restate the
relationship ("X means the same as Y") — briefly say what the shared or
opposite idea actually is. Use British English spelling.

Respond as valid JSON only, no markdown fences:
{ "explanation": "..." }`;

  const res = await client.chat.completions.create({
    model: MODEL,
    temperature: 0.6,
    response_format: { type: 'json_object' },
    messages: [{ role: 'user', content: prompt }],
  });

  const parsed = JSON.parse(res.choices[0].message.content);
  return String(parsed.explanation || '').trim();
}

async function verifyExplanation({ word, pair, relation, explanation }) {
  const relLabel = relation === 'synonym' ? 'means the same as' : 'means the opposite of';

  const prompt = `Fact-check this explanation for a UK 11+ vocabulary question.

CLAIM: "${pair}" ${relLabel} "${word}".
EXPLANATION GIVEN: ${explanation}

Is the claim actually correct, and is the explanation free of factual errors
or misleading statements?

Reply with ONLY YES or NO.`;

  const res = await client.chat.completions.create({
    model: MODEL,
    temperature: 0,
    messages: [{ role: 'user', content: prompt }],
  });

  return res.choices[0].message.content.trim().toUpperCase().startsWith('YES');
}

// Author + verify, retrying on rejection. relation is 'synonym' | 'antonym'.
async function generateVerifiedExplanation({ word, pair, relation }, { maxAttempts = 3 } = {}) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    let explanation;
    try {
      explanation = await authorExplanation({ word, pair, relation });
    } catch (e) {
      continue;
    }

    if (!explanation || explanation.length < 5 || explanation.length > 220) continue;
    if (!isCleanUKText(explanation)) continue;

    try {
      const verified = await verifyExplanation({ word, pair, relation, explanation });
      if (verified) return explanation;
    } catch (e) {
      continue;
    }
  }
  return null;
}

module.exports = { authorExplanation, verifyExplanation, generateVerifiedExplanation };

if (require.main === module) {
  (async () => {
    console.log(await generateVerifiedExplanation({ word: 'strong', pair: 'mighty', relation: 'synonym' }));
    console.log(await generateVerifiedExplanation({ word: 'hot', pair: 'cool', relation: 'antonym' }));
  })();
}
