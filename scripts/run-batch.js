// Batch question generator — routes each topic to its dedicated generator.
// Comprehension and written-answer questions use LLM (each with an
// independent verifier pass); everything else is code-computed or
// data-driven.
//
// Usage:
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... [OPENAI_API_KEY=...] node scripts/run-batch.js
//
// To run a subset: node scripts/run-batch.js --subject=Maths
//                  node scripts/run-batch.js --topic=Fractions
//                  node scripts/run-batch.js --mode=written   (written-answer only)
//                  node scripts/run-batch.js --mode=mcq       (skip written-answer)

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });

// ── generators ────────────────────────────────────────────────────────────────
const mathsGenerators = {
  Arithmetic:          require('./generators/maths/arithmetic'),
  Fractions:           require('./generators/maths/fractions'),
  Decimals:            require('./generators/maths/decimals'),
  Percentages:         require('./generators/maths/percentages'),
  'Ratio & Proportion': require('./generators/maths/ratio'),
  Algebra:             require('./generators/maths/algebra'),
  Geometry:            require('./generators/maths/geometry'),
  'Data Interpretation': require('./generators/maths/data'),
};

const vrGenerators = {
  Synonyms:       require('./generators/verbal/synonyms'),
  Antonyms:       require('./generators/verbal/antonyms'),
  Analogies:      require('./generators/verbal/analogies'),
  'Odd One Out':  require('./generators/verbal/oddoneout'),
  Coding:         require('./generators/verbal/coding'),
  'Number Series': require('./generators/verbal/numberseries'),
  Anagrams:       require('./generators/verbal/anagrams'),
  'Move-a-Letter': require('./generators/verbal/moveletter'),
  'Compound Words': require('./generators/verbal/compoundwords'),
  'Hidden Words': require('./generators/verbal/hiddenwords'),
};

const englishGenerators = {
  Spelling:      require('./generators/english/spelling'),
  Grammar:       require('./generators/english/grammar'),
  Punctuation:   require('./generators/english/punctuation'),
  Vocabulary:    require('./generators/english/vocabulary'),
  Cloze:         require('./generators/english/cloze'),
};

// comprehension and written are async (LLM-backed), all others are sync
const comprehensionGen = require('./generators/comprehension');
const writtenGen = require('./generators/written');

// ── config ────────────────────────────────────────────────────────────────────
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
// Templating (multiple question-stem phrasings per generator) roughly doubled
// or tripled most topics' real ceilings, so this can now safely pull more per
// difficulty than before without just re-hitting the same handful of rows.
const PER_TOPIC_PER_DIFFICULTY = 50;  // 50 × 3 = 150 per topic; ~4k total across all
const WRITTEN_PER_TOPIC_PER_DIFFICULTY = 10; // each costs 2 LLM calls (author + verifier)

// ── curriculum list ───────────────────────────────────────────────────────────
const TOPICS = [
  ...Object.keys(mathsGenerators).map(t => ({ topic: t, subject: 'Maths', async: false })),
  ...Object.keys(vrGenerators).map(t => ({ topic: t, subject: 'Verbal Reasoning', async: false })),
  ...Object.keys(englishGenerators).map(t => ({ topic: t, subject: 'English', async: false })),
  { topic: 'Comprehension', subject: 'English', async: true },
];

// Topics with a written-answer (free-text, rubric-graded) mode, in addition to
// their MCQ mode above.
const WRITTEN_TOPICS = ['Grammar', 'Vocabulary', 'Comprehension'];

// ── cli flags ─────────────────────────────────────────────────────────────────
const args = Object.fromEntries(
  process.argv.slice(2)
    .filter(a => a.startsWith('--'))
    .map(a => a.slice(2).split('='))
);
const filterSubject = args.subject;
const filterTopic   = args.topic;
const filterMode    = args.mode; // 'mcq' | 'written' | undefined (both)

const filteredTopics = TOPICS.filter(t => {
  if (filterSubject && t.subject !== filterSubject) return false;
  if (filterTopic && t.topic !== filterTopic) return false;
  return true;
});

const filteredWrittenTopics = WRITTEN_TOPICS.filter(t => {
  if (filterTopic && t !== filterTopic) return false;
  return true;
});

// ── supabase ──────────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// ── helpers ───────────────────────────────────────────────────────────────────
function getGenerator(topic, subject) {
  if (subject === 'Maths') return mathsGenerators[topic];
  if (subject === 'Verbal Reasoning') return vrGenerators[topic];
  if (subject === 'English') return englishGenerators[topic];
  return null;
}

async function upsertRows(rows) {
  if (!rows.length) return;
  const { error } = await supabase
    .from('questions')
    .upsert(rows, { onConflict: 'question_text,correct_answer,topic', ignoreDuplicates: true });
  if (error) console.error('  Upsert error:', error.message);
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── main ──────────────────────────────────────────────────────────────────────
async function run() {
  const runMcq = filterMode !== 'written';
  const runWritten = filterMode !== 'mcq';

  const total = (runMcq ? filteredTopics.length : 0) * DIFFICULTIES.length
    + (runWritten ? filteredWrittenTopics.length : 0) * DIFFICULTIES.length;
  console.log(`${total} batches total.\n`);

  let done = 0;

  if (runMcq) {
    for (const { topic, subject, async: isAsync } of filteredTopics) {
      for (const difficulty of DIFFICULTIES) {
        done++;
        process.stdout.write(`[${done}/${total}] ${subject} / ${topic} / ${difficulty} ... `);

        if (isAsync) {
          // Comprehension: each call returns 4 questions for one passage
          const rows = [];
          let passes = 0;
          while (rows.length < PER_TOPIC_PER_DIFFICULTY && passes < 30) {
            passes++;
            try {
              const qs = await comprehensionGen.generate(difficulty);
              rows.push(...qs);
            } catch (e) {
              process.stdout.write('(retry) ');
            }
            await sleep(500);
          }
          await upsertRows(rows.slice(0, PER_TOPIC_PER_DIFFICULTY));
          console.log(`${rows.length} generated`);
        } else {
          const gen = getGenerator(topic, subject);
          if (!gen) { console.log('NO GENERATOR'); continue; }

          const rows = [];
          let attempts = 0;
          const maxAttempts = PER_TOPIC_PER_DIFFICULTY * 5;

          while (rows.length < PER_TOPIC_PER_DIFFICULTY && attempts < maxAttempts) {
            attempts++;
            const q = gen.generate(difficulty);
            if (q) rows.push(q);
          }

          await upsertRows(rows);
          console.log(`${rows.length} generated (${attempts} attempts)`);
        }
      }
    }
  }

  if (runWritten) {
    for (const topic of filteredWrittenTopics) {
      for (const difficulty of DIFFICULTIES) {
        done++;
        process.stdout.write(`[${done}/${total}] Written / ${topic} / ${difficulty} ... `);

        const rows = [];
        let attempts = 0;
        const maxAttempts = WRITTEN_PER_TOPIC_PER_DIFFICULTY * 3;

        while (rows.length < WRITTEN_PER_TOPIC_PER_DIFFICULTY && attempts < maxAttempts) {
          attempts++;
          try {
            const q = topic === 'Comprehension'
              ? await comprehensionGen.generateWritten(difficulty)
              : await writtenGen.generate(topic, difficulty);
            if (q) rows.push(q);
          } catch (e) {
            process.stdout.write('(retry) ');
          }
          await sleep(500);
        }

        await upsertRows(rows);
        console.log(`${rows.length} generated (${attempts} attempts)`);
      }
    }
  }

  console.log('\nDone.');
}

run().catch(e => { console.error(e); process.exit(1); });
