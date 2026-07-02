// UK-English guard. Conservative on purpose: only clearly-American forms, since
// -ise/-ize is genuinely ambiguous in British English (Oxford spelling).

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

module.exports = { isCleanUKText, US_SPELLING_PATTERNS };
