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
 *   correct        - string form of the correct answer
 *   distractors    - array of string wrong answers (value-distinct from correct)
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
  } = params;

  const qText = String(question_text || '').trim();
  const expl = String(explanation || '').trim();

  if (qText.length < 5 || qText.length > 240) return null;
  if (expl.length < 5) return null;
  if (!isCleanUKText(qText) || !isCleanUKText(expl)) return null;

  const built = buildOptions(correct, distractors);
  if (!built) return null;
  if (built.options.some((o) => !isCleanUKText(o))) return null;

  return {
    subject,
    topic,
    difficulty,
    question_text: qText,
    options: built.options,
    correct_answer: built.correct_answer,
    explanation: expl,
    type: 'mcq',
  };
}

module.exports = { finalize };
