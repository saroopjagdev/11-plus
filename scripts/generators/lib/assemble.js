const { buildOptions } = require('./options');
const { isCleanUKText } = require('./uk-english');

/**
 * Final gate every generated question passes through. Builds the balanced option
 * set and validates structure + UK English. Returns a ready-to-insert row or
 * null (caller retries). Keeping this in one place means no generator can skip a
 * check.
 *
 * params:
 *   subject, topic, difficulty, question_text, explanation
 *   correct           - string form of the correct answer
 *   distractors       - array of string wrong answers (value-distinct from correct)
 *   example_sentence  - optional; a sentence showing the tested word/concept in
 *                        context (e.g. Vocabulary). Omit for topics that don't use it.
 */
function finalize(params) {
  const {
    subject,
    topic,
    difficulty,
    question_text,
    explanation,
    correct,
    distractors,
    example_sentence,
  } = params;

  const qText = String(question_text || '').trim();
  const expl = String(explanation || '').trim();

  if (qText.length < 5 || qText.length > 240) return null;
  if (expl.length < 5) return null;
  if (!isCleanUKText(qText) || !isCleanUKText(expl)) return null;

  let sentence = null;
  if (example_sentence != null) {
    sentence = String(example_sentence).trim();
    if (sentence.length < 5 || sentence.length > 200) return null;
    if (!isCleanUKText(sentence)) return null;
  }

  const built = buildOptions(correct, distractors);
  if (!built) return null;
  if (built.options.some((o) => !isCleanUKText(o))) return null;

  const row = {
    subject,
    topic,
    difficulty,
    question_text: qText,
    options: built.options,
    correct_answer: built.correct_answer,
    explanation: expl,
    type: 'mcq',
  };
  // Only set when a generator actually supplies one, so topics that don't use
  // this field keep an identical insert payload to before (no dependency on
  // the example_sentence column existing until a generator opts in).
  if (sentence !== null) row.example_sentence = sentence;
  return row;
}

module.exports = { finalize };
