// Small random helpers shared by every generator.

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Sample up to `n` distinct items from an array (no replacement).
function sample(array, n) {
  return shuffle(array).slice(0, n);
}

module.exports = { randInt, pick, shuffle, sample };
