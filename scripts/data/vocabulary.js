// Vocabulary-in-context data: a word, its correct meaning, and plausible wrong
// meanings (drawn to be tempting, not obviously silly). Four distractors per
// entry so the option set can be a full 4+1.

module.exports = [
  { word: 'timid', meaning: 'shy and easily frightened', distractors: ['very tall', 'extremely loud', 'brightly coloured', 'unusually strong'], difficulty: 'Easy' },
  { word: 'ancient', meaning: 'very old', distractors: ['brand new', 'very small', 'nearby', 'expensive'], difficulty: 'Easy' },
  { word: 'weary', meaning: 'very tired', distractors: ['very hungry', 'quite cheerful', 'rather cold', 'slightly confused'], difficulty: 'Easy' },
  { word: 'gaze', meaning: 'to look steadily', distractors: ['to run quickly', 'to speak softly', 'to fall over', 'to eat slowly'], difficulty: 'Easy' },

  { word: 'reluctant', meaning: 'unwilling to do something', distractors: ['eager to help', 'unable to hear', 'extremely proud', 'always punctual'], difficulty: 'Medium' },
  { word: 'abundant', meaning: 'existing in large amounts', distractors: ['very rare', 'poorly made', 'clearly visible', 'quickly forgotten'], difficulty: 'Medium' },
  { word: 'feeble', meaning: 'lacking strength', distractors: ['full of energy', 'very clever', 'brightly lit', 'well organised'], difficulty: 'Medium' },
  { word: 'vivid', meaning: 'bright and clear', distractors: ['dull and faded', 'soft and quiet', 'cold and damp', 'thin and fragile'], difficulty: 'Medium' },

  { word: 'meticulous', meaning: 'showing great attention to detail', distractors: ['careless and rushed', 'loud and cheerful', 'shy and quiet', 'fast and reckless'], difficulty: 'Hard' },
  { word: 'benevolent', meaning: 'kind and generous', distractors: ['cruel and harsh', 'quick and clever', 'dull and boring', 'proud and vain'], difficulty: 'Hard' },
  { word: 'tenacious', meaning: 'holding on firmly; persistent', distractors: ['giving up easily', 'extremely fragile', 'brightly coloured', 'quietly nervous'], difficulty: 'Hard' },
  { word: 'candid', meaning: 'honest and straightforward', distractors: ['secretive and sly', 'nervous and shaky', 'slow and lazy', 'wealthy and generous'], difficulty: 'Hard' },
  { word: 'serene', meaning: 'calm and peaceful', distractors: ['noisy and chaotic', 'sharp and painful', 'rich and expensive', 'quick and clumsy'], difficulty: 'Hard' },
];
