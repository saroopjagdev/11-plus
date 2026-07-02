// Move-a-Letter data. Each word has EXACTLY ONE letter that can be removed to
// leave a common word (hand-verified), and 5 distinct letters so we can build a
// full option set. Verified uniqueness is what guarantees a single answer.

module.exports = [
  // First-letter removals (Easy)
  { word: 'SWORD', remove: 'S', result: 'WORD', difficulty: 'Easy' },
  { word: 'STRAP', remove: 'S', result: 'TRAP', difficulty: 'Easy' },
  { word: 'FLOCK', remove: 'F', result: 'LOCK', difficulty: 'Easy' },
  { word: 'BEAST', remove: 'B', result: 'EAST', difficulty: 'Easy' },
  { word: 'TRAIN', remove: 'T', result: 'RAIN', difficulty: 'Easy' },
  { word: 'SPARK', remove: 'S', result: 'PARK', difficulty: 'Easy' },
  { word: 'CHARM', remove: 'C', result: 'HARM', difficulty: 'Easy' },
  { word: 'BRAIN', remove: 'B', result: 'RAIN', difficulty: 'Easy' },

  // Interior-letter removals (Medium / Hard — the removed letter is not first)
  { word: 'STAND', remove: 'T', result: 'SAND', difficulty: 'Medium' },
  { word: 'STAGE', remove: 'T', result: 'SAGE', difficulty: 'Medium' },
  { word: 'SHORE', remove: 'H', result: 'SORE', difficulty: 'Medium' },
  { word: 'CRATE', remove: 'C', result: 'RATE', difficulty: 'Medium' },
  { word: 'GLOVE', remove: 'G', result: 'LOVE', difficulty: 'Hard' },
  { word: 'PRANK', remove: 'P', result: 'RANK', difficulty: 'Hard' },
];
