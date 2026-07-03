// Written-answer generator — free-text questions with an LLM-authored marking
// rubric, graded live at answer time by src/app/actions/ai-evaluator.ts.
//
// Unlike the MCQ generators, there is no code-verifiable ground truth here, so
// quality rests on two things this file enforces:
//   1. max_marks is fixed HERE, at generation time, as part of the rubric
//      itself — the live grader (gpt-4o) is never allowed to invent or change
//      the total, only award 0..max_marks against it. This stops the same
//      question being worth different marks for different students.
//   2. An independent verifier pass (separate call, no author context) checks
//      the rubric is unambiguous, fully explains how to earn every mark, and
//      doesn't require anything the question/passage doesn't provide.

const OpenAI = require('openai');
const { isCleanUKText } = require('./lib/uk-english');

if (require.main === module) {
  require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });
}

const MODEL = 'gpt-4o';
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const TOPIC_BRIEFS = {
  Grammar: {
    subject: 'English',
    prompt: (difficulty) => `Write one UK 11+ written-answer Grammar question for a ${difficulty.toLowerCase()}-difficulty pupil (age 9-11). Good formats: "Rewrite this sentence correcting the grammar mistakes: ..." or "Identify and correct the two grammar errors in this sentence: ...". Use British English throughout.`,
  },
  Vocabulary: {
    subject: 'English',
    prompt: (difficulty) => `Write one UK 11+ written-answer Vocabulary question for a ${difficulty.toLowerCase()}-difficulty pupil (age 9-11). Good format: "Use the word '___' correctly in a sentence that shows you understand its meaning," using a word appropriate to the difficulty level. Use British English throughout.`,
  },
};

async function generateRubricQuestion(topic, difficulty) {
  const brief = TOPIC_BRIEFS[topic];
  const prompt = `You are writing a UK 11+ exam written-answer question with a marking rubric.

${brief.prompt(difficulty)}

Decide a fixed total number of marks for this question (1-3), based on how many
distinct things a full-marks answer must get right. Write the rubric as a list
of specific, checkable criteria whose mark values sum to that total — a marker
who has never seen this question must be able to award marks consistently from
the rubric alone, with no guesswork.

Respond as valid JSON only, no markdown fences:
{
  "question_text": "...",
  "max_marks": 2,
  "rubric": "Award 1 mark if ... Award 1 further mark if ...",
  "model_answer": "a complete answer that would score full marks"
}`;

  const res = await client.chat.completions.create({
    model: MODEL,
    temperature: 0.6,
    response_format: { type: 'json_object' },
    messages: [{ role: 'user', content: prompt }],
  });

  return JSON.parse(res.choices[0].message.content);
}

async function verifyRubric(questionText, rubric, maxMarks, modelAnswer) {
  const prompt = `You are auditing a UK 11+ exam marking rubric before it is published, with no
knowledge of who wrote it.

QUESTION: ${questionText}
TOTAL MARKS: ${maxMarks}
RUBRIC: ${rubric}
MODEL ANSWER: ${modelAnswer}

Check all of the following:
1. The rubric's criteria are specific and checkable (not vague like "good answer").
2. The rubric's mark values sum to exactly ${maxMarks}.
3. The model answer, if marked strictly against the rubric, would score full marks (${maxMarks}/${maxMarks}).
4. The question does not require outside information beyond what it states.

Respond with ONLY the word PASS if all four checks succeed, or FAIL if any do not. Nothing else.`;

  const res = await client.chat.completions.create({
    model: MODEL,
    temperature: 0,
    messages: [{ role: 'user', content: prompt }],
  });

  return res.choices[0].message.content.trim().toUpperCase().startsWith('PASS');
}

async function generate(topic, difficulty) {
  if (!TOPIC_BRIEFS[topic]) return null;
  const MAX_ATTEMPTS = 3;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    let raw;
    try {
      raw = await generateRubricQuestion(topic, difficulty);
    } catch (e) {
      continue;
    }

    const { question_text, max_marks, rubric, model_answer } = raw;
    if (!question_text || !rubric || !model_answer) continue;
    if (!Number.isFinite(max_marks) || max_marks < 1 || max_marks > 3) continue;
    if (!isCleanUKText(question_text) || !isCleanUKText(rubric)) continue;

    let verified;
    try {
      verified = await verifyRubric(question_text, rubric, max_marks, model_answer);
    } catch (e) {
      continue;
    }
    if (!verified) continue;

    return {
      subject: TOPIC_BRIEFS[topic].subject,
      topic,
      difficulty,
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

module.exports = { generate, TOPICS: Object.keys(TOPIC_BRIEFS) };

if (require.main === module) {
  (async () => {
    for (const topic of Object.keys(TOPIC_BRIEFS)) {
      for (const d of ['Easy', 'Medium', 'Hard']) {
        console.log(`\n=== ${topic} / ${d} ===`);
        const q = await generate(topic, d);
        console.log(q ? `${q.question_text}\n   [${q.max_marks} marks] Rubric: ${q.correct_answer}` : 'FAILED / rejected by verifier');
      }
    }
  })();
}
