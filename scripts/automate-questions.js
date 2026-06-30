const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

// 1. Load Environment Variables
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    env[key.trim()] = valueParts.join('=').trim();
  }
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

// Quality over cost: use a capable model for both writing and checking.
// Answer-key correctness is the entire value of an exam-prep product, so we do
// NOT fall back to a mini model the way the old script did.
const MODEL = env.QUESTION_GEN_MODEL || 'gpt-4o';

// MCQ option count. GL papers use 5 options, which is what the app renders.
const MCQ_OPTIONS = 5;

// Clearly American spellings that must never appear in UK 11+ content. Kept
// conservative — we avoid -ise/-ize which is genuinely ambiguous in British
// English (Oxford spelling allows -ize).
const US_SPELLING_PATTERNS = [
  /\bcolor(s|ed|ing)?\b/i, /\bflavor(s|ed|ing)?\b/i, /\bhonor(s|ed|ing)?\b/i,
  /\bneighbor(s|hood|ing)?\b/i, /\bcenter(s|ed|ing)?\b/i, /\btheater(s)?\b/i,
  /\bdefense\b/i, /\boffense\b/i, /\bgray\b/i, /\baluminum\b/i,
  /\bliter(s)?\b/i, /\btraveling\b/i, /\btraveled\b/i, /\bcanceled\b/i,
  /\bfavorite(s)?\b/i, /\bjewelry\b/i, /\bplow\b/i, /\bmath\b/i, /\bgotten\b/i,
];

function isCleanUKText(text) {
  if (typeof text !== 'string') return false;
  return !US_SPELLING_PATTERNS.some((pattern) => pattern.test(text));
}

// Cross-batch de-dupe within a single run. Module-level so it persists across
// every automate() call in one `node run-batch.js` execution.
const seenQuestionTexts = new Set();

function difficultyGuidance(difficulty) {
  switch (difficulty) {
    case 'Easy': return 'Easy = accessible to a typical Year 4 child. One step, friendly numbers, common vocabulary.';
    case 'Medium': return 'Medium = typical Year 5 standard. Two steps or a modest vocabulary stretch.';
    case 'Hard': return 'Hard = top-of-cohort grammar-school standard. Multi-step reasoning or demanding vocabulary, still solvable by a strong 10-year-old.';
    default: return '';
  }
}

function buildQuestionPrompt(options, passageText) {
  const { subject, topic, difficulty, count, mode } = options;
  const isMcq = mode === 'mcq';

  return `You are a senior UK 11+ (eleven plus) examiner writing ${mode} questions for grammar-school entrance preparation (GL Assessment and CEM standards), aimed at Year 4 and Year 5 children (ages 8-10).

Subject: ${subject}
Topic: ${topic}
Difficulty: ${difficulty}. ${difficultyGuidance(difficulty)}
${passageText ? `Base every question ONLY on this reading passage:\n"""\n${passageText}\n"""` : ''}

Generate ${count} distinct questions. Vary wording and values so none are near-duplicates.

NON-NEGOTIABLE RULES (an inaccurate question is worse than no question):
1. BRITISH ENGLISH throughout: spelling (colour, centre, metre, practise/practice, maths), vocabulary, currency (£).
2. Punctuation/grammar: follow standard British conventions. The Oxford comma is NOT required — never mark an answer wrong for omitting it, and never let the Oxford comma be the only thing separating a "correct" option from a wrong one.
${isMcq ? `3. EXACTLY ONE option is correct. This is the most important rule. The other ${MCQ_OPTIONS - 1} options must each contain a clear, identifiable error that makes them definitively wrong. For "choose the correctly punctuated/spelled/written" questions, only ONE option may be error-free; every other option must contain a real, specific error. Never write a set where two options are both acceptable.
4. Provide exactly ${MCQ_OPTIONS} unique options. "correct_answer" must be character-for-character identical to one of them.` :
`3. This is a written-answer question. "correct_answer" must be a detailed marking rubric in the form "Award X marks if...". Leave "options" as an empty array.`}
5. No ambiguity, no trick wording, no opinion-based questions. A competent examiner must agree on the single correct answer${isMcq ? '' : ' / mark scheme'}.
6. PLAIN TEXT ONLY: no LaTeX, markdown, code formatting, backslashes or braces. Write fractions as plain text like 3/4.
7. Age-appropriate: nothing sexual, violent, graphic, medical, or otherwise adult.
8. Length: question under 220 characters${isMcq ? '; each option under 70 characters' : ''}.
9. Provide a short, child-friendly "explanation" (one or two sentences) of why the correct answer is right.

${isMcq ? 'Before returning, for EACH question solve it yourself, then check every other option and confirm it is definitely wrong.' : ''}

Respond ONLY as JSON:
{
  "questions": [
    {
      "question_text": "...",
      "options": ${isMcq ? `["A","B","C","D","E"]` : `[]`},
      "correct_answer": "${isMcq ? 'exact text of the correct option' : 'Award X marks if...'}",
      "explanation": "why the answer is right"
    }
  ]
}`;
}

function validateQuestion(raw, mode) {
  const isMcq = mode === 'mcq';
  const question_text = typeof raw.question_text === 'string' ? raw.question_text.trim() : '';
  const correct_answer = typeof raw.correct_answer === 'string' ? raw.correct_answer.trim() : '';
  const explanation = typeof raw.explanation === 'string' ? raw.explanation.trim() : '';
  const options = Array.isArray(raw.options)
    ? raw.options.map((o) => (typeof o === 'string' ? o.trim() : '')).filter(Boolean)
    : [];

  if (question_text.length < 5 || question_text.length > 240) return null;
  if (!correct_answer) return null;
  if (explanation.length < 5) return null;
  if (!isCleanUKText(question_text)) return null;
  if (!isCleanUKText(correct_answer)) return null;

  if (isMcq) {
    if (options.length !== MCQ_OPTIONS) return null;
    if (new Set(options).size !== MCQ_OPTIONS) return null; // unique options
    if (!options.includes(correct_answer)) return null;     // answer must be an option
    if (options.some((o) => !isCleanUKText(o))) return null;
  } else {
    if (options.length !== 0) return null; // written questions carry no options
  }

  return { question_text, options, correct_answer, explanation };
}

/**
 * Independent verifier — the safeguard the old script lacked. A separate
 * examiner re-solves each MCQ from scratch (WITHOUT being told the intended
 * answer) and we keep the question only if it finds a single unambiguous answer
 * that matches. This is what catches "two options are both correct". Written
 * questions are not verified this way (they have a rubric, not one right option).
 */
async function verifyMcqs(candidates, passageText) {
  if (candidates.length === 0) return [];

  const payload = candidates.map((q, index) => ({ index, question: q.question_text, options: q.options }));

  const response = await openai.chat.completions.create({
    model: MODEL,
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You are a strict UK 11+ examiner vetting multiple-choice questions before publication. Use British English conventions; the Oxford comma is NOT required, so never treat omitting it as an error.${passageText ? `\n\nAll questions refer to this passage:\n"""\n${passageText}\n"""` : ''}

For each question, independently work out the answer yourself, then judge:
- If exactly ONE option is correct, return its exact text as "correct_answer" and "ambiguous": false.
- If TWO OR MORE options could be accepted, or NONE is clearly correct, set "ambiguous": true.
Be deliberately strict — when in doubt, mark ambiguous. A child must never be told a correct answer is wrong.`,
      },
      {
        role: 'user',
        content: `Vet these. Respond ONLY as JSON: {"results":[{"index":0,"correct_answer":"<exact option text or null>","ambiguous":false}]}\n\n${JSON.stringify(payload)}`,
      },
    ],
  });

  let parsed;
  try {
    parsed = JSON.parse(response.choices[0].message.content);
  } catch {
    return [];
  }

  const verdicts = new Map();
  for (const r of parsed.results || []) {
    if (typeof r.index === 'number') verdicts.set(r.index, r);
  }

  return candidates.filter((candidate, index) => {
    const v = verdicts.get(index);
    if (!v || v.ambiguous) return false;
    return typeof v.correct_answer === 'string' && v.correct_answer.trim() === candidate.correct_answer;
  });
}

/**
 * Generate, validate, verify and insert one batch of questions.
 */
async function automate(options) {
  const isMcq = options.mode === 'mcq';
  console.log(`🚀 [${MODEL}] ${options.count}x ${options.topic} (${options.difficulty} ${options.mode})...`);

  try {
    // A. Comprehension passage (kept from the original workflow)
    let passageId = null;
    let passageText = null;
    if (options.topic.toLowerCase() === 'comprehension') {
      console.log('📖 Generating reading passage...');
      const passagePrompt = `Create an original, engaging reading passage for a UK 11+ English exam (ages 10-11), in British English. Theme: ${options.difficulty === 'Hard' ? 'a classic Victorian mystery' : 'a modern adventure'}. Length 300-400 words. Respond as JSON: { "title": "...", "content": "..." }`;
      const pResponse = await openai.chat.completions.create({
        model: MODEL,
        messages: [{ role: 'user', content: passagePrompt }],
        response_format: { type: 'json_object' },
      });
      const passageData = JSON.parse(pResponse.choices[0].message.content);
      passageText = passageData.content;
      const { data: pInsert, error: pError } = await supabase
        .from('passages')
        .insert({ title: passageData.title, content: passageData.content })
        .select()
        .single();
      if (pError) throw pError;
      passageId = pInsert.id;
      console.log(`✅ Passage: "${passageData.title}"`);
    }

    // B. Generate
    const qResponse = await openai.chat.completions.create({
      model: MODEL,
      temperature: 0.8,
      messages: [
        { role: 'system', content: 'You are a professional UK 11+ exam content creator. Return only valid JSON.' },
        { role: 'user', content: buildQuestionPrompt(options, passageText) },
      ],
      response_format: { type: 'json_object' },
    });
    const generated = JSON.parse(qResponse.choices[0].message.content);

    // C. Structural validation + in-run de-dupe
    const validated = [];
    for (const raw of generated.questions || []) {
      const q = validateQuestion(raw, options.mode);
      if (!q) continue;
      const key = q.question_text.toLowerCase();
      if (seenQuestionTexts.has(key)) continue;
      seenQuestionTexts.add(key);
      validated.push(q);
    }

    // D. Independent verification (MCQ only)
    const finalQuestions = isMcq ? await verifyMcqs(validated, passageText) : validated;

    if (finalQuestions.length === 0) {
      console.log('⚠️  No questions survived validation/verification for this batch.');
      return [];
    }

    // E. Insert. ignoreDuplicates guards against any question_text collision so
    // a single clash never fails the whole batch.
    const rows = finalQuestions.map((q) => ({
      subject: options.subject,
      topic: options.topic,
      difficulty: options.difficulty,
      question_text: q.question_text,
      options: q.options,
      correct_answer: q.correct_answer,
      explanation: q.explanation,
      type: options.mode === 'mcq' ? 'mcq' : 'written',
      passage_id: passageId,
    }));

    const { data: inserted, error: qError } = await supabase
      .from('questions')
      .upsert(rows, { onConflict: 'question_text', ignoreDuplicates: true })
      .select();
    if (qError) throw qError;

    const dropped = validated.length - finalQuestions.length;
    console.log(`🎉 Inserted ${inserted.length}/${(generated.questions || []).length} (verifier dropped ${dropped}).`);
    return inserted;
  } catch (err) {
    console.error('❌ Automation failed:', err.message);
    return [];
  }
}

module.exports = { automate };
