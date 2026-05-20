const { automate } = require('./automate-questions');

// Define the full curriculum based on CURRICULUM_LADDER
const CURRICULUM = [
  // MATHS
  { topic: 'Arithmetic', subject: 'Maths', modes: ['mcq'] },
  { topic: 'Fractions', subject: 'Maths', modes: ['mcq'] },
  { topic: 'Decimals', subject: 'Maths', modes: ['mcq'] },
  { topic: 'Percentages', subject: 'Maths', modes: ['mcq'] },
  { topic: 'Ratio & Proportion', subject: 'Maths', modes: ['mcq'] },
  { topic: 'Algebra', subject: 'Maths', modes: ['mcq'] },
  { topic: 'Geometry', subject: 'Maths', modes: ['mcq'] },
  { topic: 'Data Interpretation', subject: 'Maths', modes: ['mcq'] },

  // ENGLISH
  { topic: 'Punctuation', subject: 'English', modes: ['mcq'] },
  { topic: 'Spelling', subject: 'English', modes: ['mcq'] },
  { topic: 'Grammar', subject: 'English', modes: ['mcq', 'written'] },
  { topic: 'Vocabulary', subject: 'English', modes: ['mcq', 'written'] },
  { topic: 'Comprehension', subject: 'English', modes: ['written'] },

  // VERBAL REASONING
  { topic: 'Synonyms', subject: 'Verbal Reasoning', modes: ['mcq'] },
  { topic: 'Antonyms', subject: 'Verbal Reasoning', modes: ['mcq'] },
  { topic: 'Coding', subject: 'Verbal Reasoning', modes: ['mcq'] },
  { topic: 'Number Series', subject: 'Verbal Reasoning', modes: ['mcq'] },
];

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

async function run() {
  console.log('🚀 INITIALIZING MASSIVE CONTENT GENERATION 🚀');
  console.log(`Targeting ${CURRICULUM.length} topics across ${DIFFICULTIES.length} difficulties.`);

  for (const item of CURRICULUM) {
    for (const difficulty of DIFFICULTIES) {
      for (const mode of item.modes) {
        // We split into small batches of 10 for maximum quality/focus per prompt
        const QUESTIONS_PER_BATCH = 10;
        const BATCH_COUNT = 3; // Increase this to 2 or 3 for more volume per topic

        for (let i = 0; i < BATCH_COUNT; i++) {
          console.log(`\n--- Batch ${i + 1}/${BATCH_COUNT} | ${item.topic} (${difficulty} ${mode}) ---`);
          await automate({
            subject: item.subject,
            topic: item.topic,
            difficulty: difficulty,
            count: QUESTIONS_PER_BATCH,
            mode: mode
          });
        }
      }
    }
  }

  console.log('\n\n🏁 MISSION COMPLETE: Database has been fully populated.');
}

run();
