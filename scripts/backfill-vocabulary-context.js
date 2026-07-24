// One-off backfill: generates a verified example sentence for every existing
// Vocabulary word (scripts/data/vocabulary.js) via the two-pass LLM pipeline
// in scripts/generators/lib/llm-vocabulary.js, writes it back into the data
// file, then updates the matching existing DB rows IN PLACE.
//
// Never delete+reinsert existing rows to "fix" them — deletes cascade to
// question_attempts (on delete cascade) and would silently erase student
// exam history for anyone who'd already answered that row. A direct UPDATE
// leaves question_text/options/correct_answer untouched and only enriches
// explanation + example_sentence.
//
// Usage:
//   OPENAI_API_KEY=... SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/backfill-vocabulary-context.js [--dry-run]

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const { createClient } = require('@supabase/supabase-js');
const { generateVerifiedSentence } = require('./generators/lib/llm-vocabulary');

const DATA_PATH = path.resolve(__dirname, 'data/vocabulary.js');
const DRY_RUN = process.argv.includes('--dry-run');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = SUPABASE_URL && SERVICE_KEY ? createClient(SUPABASE_URL, SERVICE_KEY) : null;

function formatEntry(e) {
  const parts = [`word: ${JSON.stringify(e.word)}`, `meaning: ${JSON.stringify(e.meaning)}`];
  if (e.sentence) parts.push(`sentence: ${JSON.stringify(e.sentence)}`);
  parts.push(`distractors: ${JSON.stringify(e.distractors)}`);
  parts.push(`difficulty: ${JSON.stringify(e.difficulty)}`);
  return `  { ${parts.join(', ')} },`;
}

async function main() {
  delete require.cache[require.resolve(DATA_PATH)];
  const DATA = require(DATA_PATH);
  console.log(`Loaded ${DATA.length} vocabulary entries.`);

  const results = [];
  for (const entry of DATA) {
    if (entry.sentence) {
      results.push(entry);
      continue;
    }
    process.stdout.write(`Generating sentence for "${entry.word}" (${entry.difficulty})... `);
    const sentence = await generateVerifiedSentence(entry);
    if (!sentence) {
      console.log('FAILED to verify — left without a sentence');
      results.push(entry);
      continue;
    }
    console.log(sentence);
    results.push({ ...entry, sentence });
  }

  const withSentence = results.filter((e) => e.sentence);
  const failed = results.filter((e) => !e.sentence);
  console.log(`\n${withSentence.length}/${results.length} entries now have a verified sentence.`);
  if (failed.length) console.log('Failed:', failed.map((e) => e.word).join(', '));

  if (DRY_RUN) {
    console.log('\n--dry-run: not writing the data file or updating the DB.');
    return;
  }

  // 1. Rewrite the data file with sentences included.
  const header =
    '// Vocabulary-in-context data: a word, its correct meaning, an example\n' +
    '// sentence showing it in context, and plausible wrong meanings (drawn to be\n' +
    '// tempting, not obviously silly). Four distractors per entry so the option\n' +
    '// set can be a full 4+1.\n\n' +
    'module.exports = [\n';
  const body = results.map(formatEntry).join('\n');
  fs.writeFileSync(DATA_PATH, `${header}${body}\n];\n`);
  console.log(`\nWrote ${DATA_PATH}`);

  // 2. Update existing DB rows in place — but only where a meaning string
  // uniquely identifies one entry, to avoid mis-stamping a sentence onto a
  // different word that happens to share a meaning string.
  if (!supabase) {
    console.log('No Supabase credentials — skipping DB backfill.');
    return;
  }

  const meaningCounts = new Map();
  for (const e of DATA) meaningCounts.set(e.meaning, (meaningCounts.get(e.meaning) || 0) + 1);
  const ambiguous = [...meaningCounts.entries()].filter(([, n]) => n > 1).map(([m]) => m);
  if (ambiguous.length) {
    console.log(`\nSkipping DB update for ${ambiguous.length} meaning(s) shared by multiple entries:`, ambiguous);
  }

  const { data: rows, error } = await supabase
    .from('questions')
    .select('id, correct_answer')
    .eq('topic', 'Vocabulary')
    .eq('type', 'mcq');
  if (error) {
    console.error('Failed to fetch existing rows:', error.message);
    return;
  }
  console.log(`\nFound ${rows.length} existing Vocabulary DB rows to backfill.`);

  let updated = 0;
  for (const entry of withSentence) {
    if (ambiguous.includes(entry.meaning)) continue;
    const matches = rows.filter((r) => r.correct_answer === entry.meaning);
    const explanation = `In the sentence "${entry.sentence}", "${entry.word}" means "${entry.meaning}".`;
    for (const row of matches) {
      const { error: updateError } = await supabase
        .from('questions')
        .update({ example_sentence: entry.sentence, explanation })
        .eq('id', row.id);
      if (updateError) {
        console.error(`  Failed to update row ${row.id} (${entry.word}):`, updateError.message);
      } else {
        updated += 1;
      }
    }
  }
  console.log(`Updated ${updated} existing DB rows.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
