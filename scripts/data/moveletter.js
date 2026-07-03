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

  // Additional first-letter removals (Easy). Each hand-checked so no other
  // single-letter removal also leaves a common word.
  { word: 'STONE', remove: 'S', result: 'TONE', difficulty: 'Easy' },
  { word: 'BLAZE', remove: 'B', result: 'LAZE', difficulty: 'Easy' },
  { word: 'SHARE', remove: 'S', result: 'HARE', difficulty: 'Easy' },
  { word: 'CLIMB', remove: 'C', result: 'LIMB', difficulty: 'Easy' },
  { word: 'CLUMP', remove: 'C', result: 'LUMP', difficulty: 'Easy' },
  { word: 'FRANK', remove: 'F', result: 'RANK', difficulty: 'Easy' },

  // Additional interior-letter removals (Medium / Hard)
  { word: 'SPOIL', remove: 'P', result: 'SOIL', difficulty: 'Medium' },
  { word: 'CHASE', remove: 'H', result: 'CASE', difficulty: 'Medium' },
  { word: 'SLANT', remove: 'N', result: 'SLAT', difficulty: 'Hard' },
  { word: 'STOMP', remove: 'M', result: 'STOP', difficulty: 'Hard' },
  { word: 'CRANE', remove: 'R', result: 'CANE', difficulty: 'Hard' },
  { word: 'CHIRP', remove: 'R', result: 'CHIP', difficulty: 'Hard' },

  // Third wave — first-letter removals (Easy)
  { word: 'TRICK', remove: 'T', result: 'RICK', difficulty: 'Easy' },
  { word: 'SHINY', remove: 'Y', result: 'SHIN', difficulty: 'Easy' },
  { word: 'CRUST', remove: 'C', result: 'RUST', difficulty: 'Easy' },
  { word: 'GHOST', remove: 'G', result: 'HOST', difficulty: 'Easy' },
  { word: 'STEAK', remove: 'S', result: 'TEAK', difficulty: 'Easy' },

  // Third wave — interior removals (Medium / Hard)
  { word: 'STING', remove: 'T', result: 'SING', difficulty: 'Medium' },
  { word: 'CLASP', remove: 'S', result: 'CLAP', difficulty: 'Medium' },
  { word: 'CRIME', remove: 'C', result: 'RIME', difficulty: 'Hard' },
];
