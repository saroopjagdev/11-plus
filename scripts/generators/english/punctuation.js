// Punctuation — same error-injection mechanism as grammar.js (the correct
// option is always untouched; every distractor has exactly one authored
// error), filed under its own curriculum topic.

const { generateForTopic } = require('./grammar');

const SUBJECT = 'English';
const TOPIC = 'Punctuation';

function generate(difficulty) {
  return generateForTopic(difficulty, TOPIC);
}

module.exports = { generate, TOPIC, SUBJECT };

if (require.main === module) {
  for (const d of ['Easy', 'Medium', 'Hard']) {
    console.log(`\n=== ${d} ===`);
    for (let i = 0; i < 3; i += 1) { const q = generate(d); if (q) console.log(`${q.question_text}\n   [${q.options.join(' | ')}]\n   ✓ ${q.correct_answer}`); }
  }
}
