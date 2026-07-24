// Expands the Vocabulary data pool by generating brand-new, verified words
// via the two-pass LLM pipeline (scripts/generators/lib/llm-vocabulary.js)
// and appending them to scripts/data/vocabulary.js. Existing entries are
// left untouched — this only adds rows.
//
// Usage:
//   OPENAI_API_KEY=... node scripts/expand-vocabulary-pool.js [--dry-run] [--target=30]

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const { generateVerifiedNewWord } = require('./generators/lib/llm-vocabulary');

const DATA_PATH = path.resolve(__dirname, 'data/vocabulary.js');
const DRY_RUN = process.argv.includes('--dry-run');
const targetArg = process.argv.find((a) => a.startsWith('--target='));
const TARGET_PER_TIER = targetArg ? parseInt(targetArg.split('=')[1], 10) : 30;
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

function formatEntry(e) {
  const parts = [
    `word: ${JSON.stringify(e.word)}`,
    `meaning: ${JSON.stringify(e.meaning)}`,
    `sentence: ${JSON.stringify(e.sentence)}`,
    `distractors: ${JSON.stringify(e.distractors)}`,
    `difficulty: ${JSON.stringify(e.difficulty)}`,
  ];
  return `  { ${parts.join(', ')} },`;
}

async function main() {
  delete require.cache[require.resolve(DATA_PATH)];
  const DATA = require(DATA_PATH);
  console.log(`Loaded ${DATA.length} existing vocabulary entries.`);

  const excludeWords = DATA.map((e) => e.word);
  const newEntries = [];

  for (const difficulty of DIFFICULTIES) {
    const currentCount = DATA.filter((e) => e.difficulty === difficulty).length;
    const needed = Math.max(0, TARGET_PER_TIER - currentCount);
    console.log(`\n${difficulty}: have ${currentCount}, need ${needed} more (target ${TARGET_PER_TIER}).`);

    let generated = 0;
    let failedAttempts = 0;
    const maxFailures = needed * 3 + 5;

    while (generated < needed && failedAttempts < maxFailures) {
      process.stdout.write(`  [${generated + 1}/${needed}] generating... `);
      const entry = await generateVerifiedNewWord({ difficulty, excludeWords });
      if (!entry) {
        console.log('FAILED to verify, retrying');
        failedAttempts += 1;
        continue;
      }
      console.log(`"${entry.word}" — ${entry.sentence}`);
      newEntries.push(entry);
      excludeWords.push(entry.word);
      generated += 1;
    }
    if (generated < needed) {
      console.log(`  Stopped after ${failedAttempts} failed attempts, only got ${generated}/${needed}.`);
    }
  }

  console.log(`\nGenerated ${newEntries.length} new verified words total.`);

  if (DRY_RUN) {
    console.log('--dry-run: not writing the data file.');
    return;
  }

  if (!newEntries.length) {
    console.log('Nothing to write.');
    return;
  }

  const header =
    '// Vocabulary-in-context data: a word, its correct meaning, an example\n' +
    '// sentence showing it in context, and plausible wrong meanings (drawn to be\n' +
    '// tempting, not obviously silly). Four distractors per entry so the option\n' +
    '// set can be a full 4+1.\n\n' +
    'module.exports = [\n';
  const body = [...DATA, ...newEntries].map(formatEntry).join('\n');
  fs.writeFileSync(DATA_PATH, `${header}${body}\n];\n`);
  console.log(`\nWrote ${DATA_PATH} — ${DATA.length + newEntries.length} total entries.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
