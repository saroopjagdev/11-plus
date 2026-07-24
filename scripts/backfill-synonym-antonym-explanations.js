// One-off backfill: generates a verified richer explanation for every
// (word, synonym) / (word, antonym) pair in scripts/data/synonyms.js and
// antonyms.js via the two-pass LLM pipeline in
// scripts/generators/lib/llm-explanation.js, writes the results into
// scripts/data/synonym-explanations.js / antonym-explanations.js, then
// updates matching existing DB rows IN PLACE (never delete+reinsert — see
// scripts/backfill-vocabulary-context.js for why).
//
// Matching an existing DB row back to its source pair: question_text always
// contains the target word in ALL CAPS (every stem uses .toUpperCase()), so
// the pair is uniquely identified by (target word from question_text,
// correct_answer) together — this resolves the ambiguity that matching on
// correct_answer alone would have (the same word can be a valid synonym of
// more than one target word).
//
// Usage:
//   OPENAI_API_KEY=... SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/backfill-synonym-antonym-explanations.js [--dry-run] [--topic=Synonyms|Antonyms]

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const { createClient } = require('@supabase/supabase-js');
const { generateVerifiedExplanation } = require('./generators/lib/llm-explanation');

const DRY_RUN = process.argv.includes('--dry-run');
const topicArg = process.argv.find((a) => a.startsWith('--topic='));
const filterTopic = topicArg ? topicArg.split('=')[1] : null;

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = SUPABASE_URL && SERVICE_KEY ? createClient(SUPABASE_URL, SERVICE_KEY) : null;

const TOPICS = [
  {
    name: 'Synonyms',
    relation: 'synonym',
    dataPath: path.resolve(__dirname, 'data/synonyms.js'),
    explanationsPath: path.resolve(__dirname, 'data/synonym-explanations.js'),
    pairField: 'synonyms',
  },
  {
    name: 'Antonyms',
    relation: 'antonym',
    dataPath: path.resolve(__dirname, 'data/antonyms.js'),
    explanationsPath: path.resolve(__dirname, 'data/antonym-explanations.js'),
    pairField: 'antonyms',
  },
].filter((t) => !filterTopic || t.name === filterTopic);

// Extract the ALL-CAPS target word every question stem embeds, e.g.
// "Which word means the same as STRONG?" -> "strong".
function extractTargetWord(questionText) {
  const match = questionText.match(/\b([A-Z]{2,})\b/);
  return match ? match[1].toLowerCase() : null;
}

async function processTopic({ name, relation, dataPath, explanationsPath, pairField }) {
  console.log(`\n=== ${name} ===`);
  delete require.cache[require.resolve(dataPath)];
  const DATA = require(dataPath);

  const map = {};
  let generated = 0;
  let failed = 0;

  for (const entry of DATA) {
    for (const pair of entry[pairField]) {
      const key = `${entry.word.toLowerCase()}:${pair.toLowerCase()}`;
      process.stdout.write(`  ${entry.word} : ${pair} ... `);
      const explanation = await generateVerifiedExplanation({ word: entry.word, pair, relation });
      if (!explanation) {
        console.log('FAILED to verify — left without a rich explanation');
        failed += 1;
        continue;
      }
      console.log(explanation);
      map[key] = explanation;
      generated += 1;
    }
  }

  console.log(`\n${name}: ${generated} explanations generated, ${failed} failed.`);

  if (DRY_RUN) {
    console.log(`${name}: --dry-run, not writing files or updating DB.`);
    return { name, map };
  }

  const sortedKeys = Object.keys(map).sort();
  const body = sortedKeys.map((k) => `  ${JSON.stringify(k)}: ${JSON.stringify(map[k])},`).join('\n');
  const header =
    `// Richer, LLM-authored + verified explanations for specific (word, ${relation}) ` +
    `pairs, keyed by \`\${word}:\${${relation}}\` (both lowercase). Populated by ` +
    'scripts/backfill-synonym-antonym-explanations.js. Falls back to a flat ' +
    'one-liner in the generator when a pair has no entry here yet.\n' +
    'module.exports = {\n';
  fs.writeFileSync(explanationsPath, `${header}${body}\n};\n`);
  console.log(`Wrote ${explanationsPath}`);

  return { name, map };
}

async function backfillDbRows({ name, map }) {
  if (!supabase) {
    console.log(`${name}: no Supabase credentials — skipping DB backfill.`);
    return;
  }

  const { data: rows, error } = await supabase
    .from('questions')
    .select('id, question_text, correct_answer')
    .eq('topic', name)
    .eq('type', 'mcq');
  if (error) {
    console.error(`${name}: failed to fetch existing rows:`, error.message);
    return;
  }
  console.log(`\n${name}: found ${rows.length} existing DB rows to consider.`);

  let updated = 0;
  let unmatched = 0;
  for (const row of rows) {
    const targetWord = extractTargetWord(row.question_text);
    if (!targetWord) {
      unmatched += 1;
      continue;
    }
    const key = `${targetWord}:${row.correct_answer.toLowerCase()}`;
    const explanation = map[key];
    if (!explanation) {
      unmatched += 1;
      continue;
    }
    const { error: updateError } = await supabase.from('questions').update({ explanation }).eq('id', row.id);
    if (updateError) {
      console.error(`  Failed to update row ${row.id}:`, updateError.message);
    } else {
      updated += 1;
    }
  }
  console.log(`${name}: updated ${updated} rows, ${unmatched} left as-is (no matching pair found).`);
}

async function main() {
  const results = [];
  for (const topic of TOPICS) {
    results.push(await processTopic(topic));
  }
  if (DRY_RUN) return;
  for (const result of results) {
    await backfillDbRows(result);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
