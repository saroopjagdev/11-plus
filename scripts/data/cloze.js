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

  { sentence: 'The kitten was ___ after chasing the ball for so long.', correct: 'exhausted', distractors: ['delicious', 'square', 'loud', 'musical'], difficulty: 'Easy' },
  { sentence: 'He felt ___ when he saw the surprise party.', correct: 'delighted', distractors: ['triangular', 'salty', 'distant', 'heavy'], difficulty: 'Easy' },
  { sentence: 'The ice cream started to ___ in the sun.', correct: 'melt', distractors: ['whisper', 'measure', 'argue', 'paint'], difficulty: 'Easy' },
  { sentence: 'She ___ the letter before sending it.', correct: 'sealed', distractors: ['tasted', 'coloured', 'shouted', 'swam'], difficulty: 'Easy' },
  { sentence: 'The old house looked ___ in the moonlight.', correct: 'eerie', distractors: ['delicious', 'crunchy', 'musical', 'square'], difficulty: 'Easy' },

  { sentence: 'The scientist made an ___ discovery in her laboratory.', correct: 'unexpected', distractors: ['deliciously', 'politely', 'numerically', 'fragrantly'], difficulty: 'Medium' },
  { sentence: 'His argument was so ___ that nobody could disagree.', correct: 'convincing', distractors: ['salty', 'square', 'distant', 'musical'], difficulty: 'Medium' },
  { sentence: 'The athlete showed great ___ during the final lap.', correct: 'determination', distractors: ['fragrance', 'punctuality', 'circularity', 'saltiness'], difficulty: 'Medium' },
  { sentence: 'The garden looked ___ after weeks of neglect.', correct: 'overgrown', distractors: ['delighted', 'punctual', 'talkative', 'fragrant'], difficulty: 'Medium' },
  { sentence: 'Her handwriting was ___ and hard to read.', correct: 'illegible', distractors: ['delicious', 'punctual', 'fragrant', 'circular'], difficulty: 'Medium' },

  { sentence: 'The negotiations were ___, lasting well into the night.', correct: 'protracted', distractors: ['fragrant', 'circular', 'punctual', 'talkative'], difficulty: 'Hard' },
  { sentence: "His refusal to compromise made the situation increasingly ___.", correct: 'volatile', distractors: ['fragrant', 'punctual', 'talkative', 'circular'], difficulty: 'Hard' },
  { sentence: "The professor's explanation was so ___ that even experts struggled to follow it.", correct: 'convoluted', distractors: ['fragrant', 'punctual', 'talkative', 'circular'], difficulty: 'Hard' },
  { sentence: 'The evidence against him was entirely ___.', correct: 'circumstantial', distractors: ['fragrant', 'punctual', 'talkative', 'circular'], difficulty: 'Hard' },
  { sentence: 'Her calm response to the crisis was truly ___.', correct: 'admirable', distractors: ['fragrant', 'punctual', 'talkative', 'circular'], difficulty: 'Hard' },

  { sentence: 'The puppy wagged its tail when it saw its ___.', correct: 'owner', distractors: ['bright colour', 'loud noise', 'square shape', 'sweet smell'], difficulty: 'Easy' },
  { sentence: 'He felt very ___ after winning the race.', correct: 'proud', distractors: ['triangular', 'salty', 'distant', 'musical'], difficulty: 'Easy' },

  { sentence: "The teacher's feedback was ___ and helped him improve.", correct: 'constructive', distractors: ['deliciously', 'politely', 'numerically', 'fragrantly'], difficulty: 'Medium' },
  { sentence: 'The old machine made a ___ noise before stopping.', correct: 'grinding', distractors: ['salty', 'square', 'distant', 'musical'], difficulty: 'Medium' },

  { sentence: "The politician's speech was deliberately ___ to avoid controversy.", correct: 'vague', distractors: ['fragrant', 'punctual', 'talkative', 'circular'], difficulty: 'Hard' },
  { sentence: 'Her argument was ___, covering every possible objection.', correct: 'exhaustive', distractors: ['fragrant', 'punctual', 'talkative', 'circular'], difficulty: 'Hard' },
];
