// Expands the Synonyms/Antonyms data pools by generating brand-new,
// verified (word, [related...]) entries via
// scripts/generators/lib/llm-relations.js, appending them to
// scripts/data/synonyms.js / antonyms.js, and merging the pair explanations
// generated as a side effect into synonym-explanations.js /
// antonym-explanations.js. Existing entries are left untouched.
//
// Usage:
//   OPENAI_API_KEY=... node scripts/expand-synonym-antonym-pool.js [--dry-run] [--target=40] [--topic=Synonyms|Antonyms]

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const { generateVerifiedWordSet } = require('./generators/lib/llm-relations');

const DRY_RUN = process.argv.includes('--dry-run');
const targetArg = process.argv.find((a) => a.startsWith('--target='));
const TARGET_PER_TIER = targetArg ? parseInt(targetArg.split('=')[1], 10) : 40;
const topicArg = process.argv.find((a) => a.startsWith('--topic='));
const filterTopic = topicArg ? topicArg.split('=')[1] : null;
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

const TOPICS = [
  {
    name: 'Synonyms',
    relation: 'synonym',
    pairField: 'synonyms',
    dataPath: path.resolve(__dirname, 'data/synonyms.js'),
    explanationsPath: path.resolve(__dirname, 'data/synonym-explanations.js'),
  },
  {
    name: 'Antonyms',
    relation: 'antonym',
    pairField: 'antonyms',
    dataPath: path.resolve(__dirname, 'data/antonyms.js'),
    explanationsPath: path.resolve(__dirname, 'data/antonym-explanations.js'),
  },
].filter((t) => !filterTopic || t.name === filterTopic);

function formatDataEntry(e, pairField) {
  return `  { word: ${JSON.stringify(e.word)}, ${pairField}: ${JSON.stringify(e[pairField])}, difficulty: ${JSON.stringify(e.difficulty)} },`;
}

async function processTopic({ name, relation, pairField, dataPath, explanationsPath }) {
  console.log(`\n=== ${name} ===`);
  delete require.cache[require.resolve(dataPath)];
  delete require.cache[require.resolve(explanationsPath)];
  const DATA = require(dataPath);
  const EXPLANATIONS = require(explanationsPath);

  const excludeWords = DATA.map((e) => e.word);
  const newEntries = [];
  const newExplanations = {};

  for (const difficulty of DIFFICULTIES) {
    const currentCount = DATA.filter((e) => e.difficulty === difficulty).length;
    const needed = Math.max(0, TARGET_PER_TIER - currentCount);
    console.log(`${difficulty}: have ${currentCount}, need ${needed} more (target ${TARGET_PER_TIER}).`);

    let generated = 0;
    let failedAttempts = 0;
    const maxFailures = needed * 3 + 5;

    while (generated < needed && failedAttempts < maxFailures) {
      process.stdout.write(`  [${generated + 1}/${needed}] generating... `);
      const entry = await generateVerifiedWordSet({ difficulty, relation, excludeWords });
      if (!entry) {
        console.log('FAILED to verify, retrying');
        failedAttempts += 1;
        continue;
      }
      console.log(`"${entry.word}" -> ${entry[pairField].join(', ')}`);
      newEntries.push({ word: entry.word, [pairField]: entry[pairField], difficulty });
      Object.assign(newExplanations, entry.explanations);
      excludeWords.push(entry.word);
      generated += 1;
    }
    if (generated < needed) {
      console.log(`  Stopped after ${failedAttempts} failed attempts, only got ${generated}/${needed}.`);
    }
  }

  console.log(`${name}: generated ${newEntries.length} new entries, ${Object.keys(newExplanations).length} new explanations.`);

  if (DRY_RUN) {
    console.log(`${name}: --dry-run, not writing files.`);
    return;
  }

  if (newEntries.length) {
    const header = `// Vetted ${relation} sets, tiered by difficulty. Hand-authored entries plus\n// LLM-generated + verified entries added by scripts/expand-synonym-antonym-pool.js.\n\nmodule.exports = [\n`;
    const body = [...DATA, ...newEntries].map((e) => formatDataEntry(e, pairField)).join('\n');
    fs.writeFileSync(dataPath, `${header}${body}\n];\n`);
    console.log(`Wrote ${dataPath} — ${DATA.length + newEntries.length} total entries.`);
  }

  if (Object.keys(newExplanations).length) {
    const merged = { ...EXPLANATIONS, ...newExplanations };
    const sortedKeys = Object.keys(merged).sort();
    const body = sortedKeys.map((k) => `  ${JSON.stringify(k)}: ${JSON.stringify(merged[k])},`).join('\n');
    const header =
      `// Richer, LLM-authored + verified explanations for specific (word, ${relation}) ` +
      `pairs, keyed by \`\${word}:\${${relation}}\` (both lowercase). Populated by ` +
      'scripts/backfill-synonym-antonym-explanations.js and scripts/expand-synonym-antonym-pool.js. ' +
      'Falls back to a flat one-liner in the generator when a pair has no entry here yet.\n' +
      'module.exports = {\n';
    fs.writeFileSync(explanationsPath, `${header}${body}\n};\n`);
    console.log(`Wrote ${explanationsPath} — ${merged.length || Object.keys(merged).length} total explanations.`);
  }
}

async function main() {
  for (const topic of TOPICS) {
    await processTopic(topic);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
