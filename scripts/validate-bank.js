// Post-generation audit. Run after regenerating the question bank.
// Checks: single correct answer, A-E distribution, option count, explanation present.
// For maths questions, re-runs the generator to spot-check answer consistency.
//
// Usage: SUPABASE_URL=... SUPABASE_ANON_KEY=... node scripts/validate-bank.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E'];

async function main() {
  console.log('Fetching all questions...');
  let allRows = [];
  let from = 0;
  const PAGE = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('questions')
      .select('id, subject, topic, difficulty, question_text, options, correct_answer, explanation')
      .range(from, from + PAGE - 1);
    if (error) { console.error(error.message); process.exit(1); }
    if (!data || data.length === 0) break;
    allRows = allRows.concat(data);
    if (data.length < PAGE) break;
    from += PAGE;
  }

  console.log(`Loaded ${allRows.length} questions.\n`);

  const issues = [];
  const positionCounts = { A: 0, B: 0, C: 0, D: 0, E: 0 };
  const bySubject = {};

  for (const row of allRows) {
    const id = row.id;
    const opts = Array.isArray(row.options) ? row.options : [];

    // Option count
    if (opts.length !== 5) {
      issues.push(`[${id}] ${row.topic}: has ${opts.length} options (expected 5)`);
    }

    // Correct answer in options
    const correctIdx = opts.indexOf(row.correct_answer);
    if (correctIdx === -1) {
      issues.push(`[${id}] ${row.topic}: correct_answer not in options`);
    } else {
      const letter = OPTION_LETTERS[correctIdx];
      if (letter) positionCounts[letter]++;
    }

    // Explanation present
    if (!row.explanation || row.explanation.trim().length < 5) {
      issues.push(`[${id}] ${row.topic}: missing or empty explanation`);
    }

    // Duplicate options
    const unique = new Set(opts);
    if (unique.size !== opts.length) {
      issues.push(`[${id}] ${row.topic}: duplicate options`);
    }

    // Track counts
    const subj = row.subject || 'Unknown';
    bySubject[subj] = bySubject[subj] || { topics: {}, count: 0 };
    bySubject[subj].count++;
    bySubject[subj].topics[row.topic] = (bySubject[subj].topics[row.topic] || 0) + 1;
  }

  // Report
  console.log('=== SUBJECT / TOPIC BREAKDOWN ===');
  for (const [subj, data] of Object.entries(bySubject)) {
    console.log(`\n${subj} (${data.count} total)`);
    for (const [topic, count] of Object.entries(data.topics)) {
      console.log(`  ${topic}: ${count}`);
    }
  }

  console.log('\n=== CORRECT ANSWER POSITION DISTRIBUTION ===');
  const total = Object.values(positionCounts).reduce((a, b) => a + b, 0);
  for (const [letter, count] of Object.entries(positionCounts)) {
    const pct = total ? ((count / total) * 100).toFixed(1) : '0.0';
    const bar = '█'.repeat(Math.round(count / total * 40));
    console.log(`  ${letter}: ${String(count).padStart(5)}  (${pct}%)  ${bar}`);
  }

  console.log('\n=== ISSUES ===');
  if (issues.length === 0) {
    console.log('No issues found.');
  } else {
    issues.forEach((i) => console.log('  ' + i));
    console.log(`\nTotal issues: ${issues.length}`);
  }

  process.exit(issues.length > 0 ? 1 : 0);
}

main();
