// Comprehension generator — uses GPT-4o to produce a short passage + 4 MCQs,
// then runs an independent verifier pass (separate LLM call, no answer hints)
// to confirm each answer before accepting. Rejects any question where the
// verifier picks a different option.

const OpenAI = require('openai');
const { createClient } = require('@supabase/supabase-js');
const { buildOptions } = require('./lib/options');
const { isCleanUKText } = require('./lib/uk-english');

if (require.main === module) {
  require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env.local') });
}

const MODEL = 'gpt-4o';
const SUBJECT = 'English';
const TOPIC = 'Comprehension';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  : null;

const GRADE_LEVELS = {
  Easy: 'a Year 4 pupil (age 8–9)',
  Medium: 'a Year 5 pupil (age 9–10)',
  Hard: 'a Year 6 pupil (age 10–11)',
};

const PASSAGE_WORDS = { Easy: 80, Medium: 120, Hard: 160 };

async function generatePassageAndQuestions(difficulty) {
  const grade = GRADE_LEVELS[difficulty];
  const words = PASSAGE_WORDS[difficulty];

  const prompt = `You are writing a UK 11+ exam comprehension exercise.

Write a short passage of around ${words} words suitable for ${grade}.
Use British English spellings throughout (colour, practise, centre, etc.).
The passage should be engaging — it may be a story extract, description, or
factual piece. Do NOT use American spellings.

After the passage, write exactly 4 multiple-choice questions about it.
Each question must have exactly 5 options labelled A–E, with exactly one
correct answer that can be verified from the passage text alone.

Respond as valid JSON only, no markdown fences:
{
  "title": "...",
  "passage": "...",
  "questions": [
    {
      "question_text": "...",
      "correct": "...",
      "distractors": ["...", "...", "...", "..."],
      "explanation": "..."
    }
  ]
}`;

  const res = await client.chat.completions.create({
    model: MODEL,
    temperature: 0.7,
    response_format: { type: 'json_object' },
    messages: [{ role: 'user', content: prompt }],
  });

  return JSON.parse(res.choices[0].message.content);
}

async function verifyQuestion(passage, questionText, options, claimedCorrect) {
  const optList = options.map((o, i) => `${String.fromCharCode(65 + i)}) ${o}`).join('\n');

  const prompt = `Read the passage below and answer the question. Choose the best answer from the options.

PASSAGE:
${passage}

QUESTION: ${questionText}

OPTIONS:
${optList}

Reply with ONLY the letter of the correct answer (A, B, C, D, or E). Nothing else.`;

  const res = await client.chat.completions.create({
    model: MODEL,
    temperature: 0,
    messages: [{ role: 'user', content: prompt }],
  });

  const letter = res.choices[0].message.content.trim().toUpperCase();
  const idx = letter.charCodeAt(0) - 65;
  if (idx < 0 || idx >= options.length) return false;
  return options[idx] === claimedCorrect;
}

async function generate(difficulty) {
  const MAX_ATTEMPTS = 3;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    let raw;
    try {
      raw = await generatePassageAndQuestions(difficulty);
    } catch (e) {
      continue;
    }

    const { title, passage, questions } = raw;
    if (!passage || !Array.isArray(questions) || questions.length === 0) continue;
    if (!isCleanUKText(passage)) continue;
    if (title && !isCleanUKText(title)) continue;

    let passageId = null;
    if (supabase) {
      const { data: passageRow, error: passageErr } = await supabase
        .from('passages')
        .insert({ title: title || 'Reading Passage', content: passage })
        .select('id')
        .single();
      if (passageErr) continue;
      passageId = passageRow.id;
    }

    const results = [];

    for (const q of questions) {
      const { question_text, correct, distractors, explanation } = q;
      if (!question_text || !correct || !Array.isArray(distractors) || distractors.length < 4) continue;
      if (!isCleanUKText(question_text)) continue;

      const built = buildOptions(correct, distractors);
      if (!built) continue;
      if (built.options.some((o) => !isCleanUKText(o))) continue;

      const verified = await verifyQuestion(passage, question_text, built.options, built.correct_answer);
      if (!verified) continue;

      results.push({
        subject: SUBJECT,
        topic: TOPIC,
        difficulty,
        passage_id: passageId,
        question_text,
        options: built.options,
        correct_answer: built.correct_answer,
        explanation: String(explanation || '').trim() || `The passage states: "${correct}".`,
        type: 'mcq',
      });
    }

    if (results.length > 0) return results;
  }

  return [];
}

// ── written variant: one open-ended, evidence-based question per passage ──────

async function generatePassageAndWrittenQuestion(difficulty) {
  const grade = GRADE_LEVELS[difficulty];
  const words = PASSAGE_WORDS[difficulty];

  const prompt = `You are writing a UK 11+ exam comprehension exercise with a written-answer
question (not multiple choice).

Write a short passage of around ${words} words suitable for ${grade}.
Use British English spellings throughout. The passage should be engaging — a
story extract, description, or factual piece.

Then write ONE written-answer question that requires the pupil to use evidence
from the passage (e.g. "Using evidence from the passage, explain why..." or
"What does the passage suggest about...").

Decide a fixed total number of marks (1-3) based on how many distinct points a
full-marks answer needs. Write the rubric as specific, checkable criteria whose
mark values sum to that total.

Respond as valid JSON only, no markdown fences:
{
  "title": "...",
  "passage": "...",
  "question_text": "...",
  "max_marks": 2,
  "rubric": "Award 1 mark if ... Award 1 further mark if ...",
  "model_answer": "a complete answer that would score full marks, quoting the passage where relevant"
}`;

  const res = await client.chat.completions.create({
    model: MODEL,
    temperature: 0.6,
    response_format: { type: 'json_object' },
    messages: [{ role: 'user', content: prompt }],
  });

  return JSON.parse(res.choices[0].message.content);
}

async function verifyWrittenRubric(passage, questionText, rubric, maxMarks, modelAnswer) {
  const prompt = `You are auditing a UK 11+ comprehension marking rubric before publication.

PASSAGE:
${passage}

QUESTION: ${questionText}
TOTAL MARKS: ${maxMarks}
RUBRIC: ${rubric}
MODEL ANSWER: ${modelAnswer}

Check all of the following:
1. The question can be fully answered using only the passage above.
2. The rubric's criteria are specific and checkable, and require evidence from the passage.
3. The rubric's mark values sum to exactly ${maxMarks}.
4. The model answer, marked strictly against the rubric, would score full marks (${maxMarks}/${maxMarks}).

Respond with ONLY the word PASS if all four checks succeed, or FAIL if any do not. Nothing else.`;

  const res = await client.chat.completions.create({
    model: MODEL,
    temperature: 0,
    messages: [{ role: 'user', content: prompt }],
  });

  return res.choices[0].message.content.trim().toUpperCase().startsWith('PASS');
}

async function generateWritten(difficulty) {
  const MAX_ATTEMPTS = 3;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    let raw;
    try {
      raw = await generatePassageAndWrittenQuestion(difficulty);
    } catch (e) {
      continue;
    }

    const { title, passage, question_text, max_marks, rubric, model_answer } = raw;
    if (!passage || !question_text || !rubric || !model_answer) continue;
    if (!Number.isFinite(max_marks) || max_marks < 1 || max_marks > 3) continue;
    if (!isCleanUKText(passage) || !isCleanUKText(question_text) || !isCleanUKText(rubric)) continue;
    if (title && !isCleanUKText(title)) continue;

    let verified;
    try {
      verified = await verifyWrittenRubric(passage, question_text, rubric, max_marks, model_answer);
    } catch (e) {
      continue;
    }
    if (!verified) continue;

    let passageId = null;
    if (supabase) {
      const { data: passageRow, error: passageErr } = await supabase
        .from('passages')
        .insert({ title: title || 'Reading Passage', content: passage })
        .select('id')
        .single();
      if (passageErr) continue;
      passageId = passageRow.id;
    }

    return {
      subject: SUBJECT,
      topic: TOPIC,
      difficulty,
      passage_id: passageId,
      question_text: String(question_text).trim(),
      options: [],
      correct_answer: String(rubric).trim(),
      max_marks: Math.round(max_marks),
      explanation: `Model answer: ${String(model_answer).trim()}`,
      type: 'written',
    };
  }

  return null;
}

module.exports = { generate, generateWritten, TOPIC, SUBJECT };

if (require.main === module) {
  (async () => {
    for (const d of ['Easy', 'Medium', 'Hard']) {
      console.log(`\n=== ${d} ===`);
      const qs = await generate(d);
      console.log(`Generated ${qs.length} verified questions`);
      if (qs[0]) {
        console.log(`Passage ID: ${qs[0].passage_id}`);
        qs.forEach((q) => console.log(`  Q: ${q.question_text}\n     [${q.options.join(' | ')}]  ✓ ${q.correct_answer}`));
      }
    }
  })();
}
