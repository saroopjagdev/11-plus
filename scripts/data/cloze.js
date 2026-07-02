// Cloze data: a sentence with one part replaced by a blank, the correct
// completion, and distractors that are the same part of speech but don't fit
// the sentence (checked by hand so exactly one option makes sense). Four
// distractors per entry for a full 4+1 option set.

module.exports = [
  { sentence: 'The ___ walked slowly down the street.', correct: 'old man', distractors: ['bright colour', 'loud noise', 'square shape', 'sweet smell'], difficulty: 'Easy' },
  { sentence: 'She was so ___ that she fell asleep in class.', correct: 'tired', distractors: ['delicious', 'triangular', 'expensive', 'musical'], difficulty: 'Easy' },
  { sentence: 'He ___ the door before leaving the house.', correct: 'locked', distractors: ['tasted', 'measured', 'painted', 'whispered'], difficulty: 'Easy' },
  { sentence: 'The soup smelled ___ as it cooked on the stove.', correct: 'delicious', distractors: ['square', 'loud', 'heavy', 'polite'], difficulty: 'Easy' },

  { sentence: 'Despite the rain, the match continued ___.', correct: 'uninterrupted', distractors: ['deliciously', 'colourfully', 'numerically', 'politely'], difficulty: 'Medium' },
  { sentence: 'The old bridge looked ___ after years of neglect.', correct: 'dilapidated', distractors: ['delighted', 'punctual', 'fragrant', 'talkative'], difficulty: 'Medium' },
  { sentence: 'Her explanation was so ___ that everyone understood at once.', correct: 'clear', distractors: ['salty', 'heavy', 'square', 'distant'], difficulty: 'Medium' },
  { sentence: 'The explorers were ___ by the sudden storm.', correct: 'caught off guard', distractors: ['delighted equally', 'painted brightly', 'measured exactly', 'invited politely'], difficulty: 'Medium' },

  { sentence: 'The committee reached a ___ decision after hours of debate.', correct: 'unanimous', distractors: ['fragrant', 'punctual', 'brittle', 'talkative'], difficulty: 'Hard' },
  { sentence: 'His ___ approach to the problem impressed the judges.', correct: 'methodical', distractors: ['fragrant', 'salty', 'circular', 'punctual'], difficulty: 'Hard' },
  { sentence: 'The ancient manuscript was remarkably well ___ for its age.', correct: 'preserved', distractors: ['flavoured', 'punctual', 'talkative', 'circular'], difficulty: 'Hard' },
];
