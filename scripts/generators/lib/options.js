const { shuffle } = require('./random');

// GL papers use 5 options; the app renders whatever it's given.
const OPTION_COUNT = 5;

// Round-robin cursor so the correct answer's position is evenly spread across
// A–E over the whole run, instead of clustering (the old bank was "always A").
let positionCursor = 0;

function resetPositionCursor() {
  positionCursor = 0;
}

/**
 * Build a validated option set.
 *
 * `correct` and `distractors` are the string forms of the answer and the wrong
 * options. Distractors are de-duped and any equal to the correct string are
 * dropped — generators are responsible for ensuring distractors differ from the
 * answer in VALUE (e.g. fractions compared by cross-multiplication) before
 * passing them here.
 *
 * Returns { options, correct_answer } or null if there aren't enough distinct
 * distractors to fill the set (the caller should try again).
 */
function buildOptions(correct, distractors, count = OPTION_COUNT) {
  const correctStr = String(correct).trim();
  const seen = new Set([correctStr]);
  const unique = [];
  for (const d of distractors) {
    const s = String(d).trim();
    if (!s || seen.has(s)) continue;
    seen.add(s);
    unique.push(s);
  }

  if (unique.length < count - 1) return null;

  const chosen = shuffle(unique).slice(0, count - 1);
  const position = positionCursor % count;
  positionCursor += 1;

  const options = [];
  let di = 0;
  for (let i = 0; i < count; i += 1) {
    if (i === position) options.push(correctStr);
    else options.push(chosen[di++]);
  }

  return { options, correct_answer: correctStr };
}

module.exports = { buildOptions, resetPositionCursor, OPTION_COUNT };
