// Vetted synonym sets, tiered by difficulty. Each entry: a target word, a list
// of genuine synonyms (any is an acceptable answer), and the difficulty tier.
// Hand-verified — this is the "check once, reuse forever" data.

module.exports = [
  // Easy — everyday words
  { word: 'big', synonyms: ['large', 'huge', 'enormous'], difficulty: 'Easy' },
  { word: 'small', synonyms: ['tiny', 'little', 'minute'], difficulty: 'Easy' },
  { word: 'happy', synonyms: ['glad', 'cheerful', 'pleased'], difficulty: 'Easy' },
  { word: 'sad', synonyms: ['unhappy', 'miserable', 'gloomy'], difficulty: 'Easy' },
  { word: 'fast', synonyms: ['quick', 'rapid', 'swift'], difficulty: 'Easy' },
  { word: 'cold', synonyms: ['chilly', 'freezing', 'icy'], difficulty: 'Easy' },
  { word: 'begin', synonyms: ['start', 'commence'], difficulty: 'Easy' },
  { word: 'end', synonyms: ['finish', 'conclude'], difficulty: 'Easy' },
  { word: 'shout', synonyms: ['yell', 'call', 'bellow'], difficulty: 'Easy' },
  { word: 'brave', synonyms: ['bold', 'fearless', 'courageous'], difficulty: 'Easy' },

  // Medium — mid-tier vocabulary
  { word: 'vast', synonyms: ['enormous', 'immense', 'massive'], difficulty: 'Medium' },
  { word: 'weary', synonyms: ['tired', 'exhausted', 'fatigued'], difficulty: 'Medium' },
  { word: 'furious', synonyms: ['angry', 'enraged', 'livid'], difficulty: 'Medium' },
  { word: 'ancient', synonyms: ['old', 'aged', 'antique'], difficulty: 'Medium' },
  { word: 'timid', synonyms: ['shy', 'nervous', 'bashful'], difficulty: 'Medium' },
  { word: 'reveal', synonyms: ['show', 'disclose', 'expose'], difficulty: 'Medium' },
  { word: 'wealthy', synonyms: ['rich', 'affluent', 'prosperous'], difficulty: 'Medium' },
  { word: 'sturdy', synonyms: ['strong', 'robust', 'solid'], difficulty: 'Medium' },
  { word: 'gloomy', synonyms: ['dark', 'dismal', 'dreary'], difficulty: 'Medium' },
  { word: 'delicate', synonyms: ['fragile', 'dainty', 'flimsy'], difficulty: 'Medium' },

  // Hard — genuine 11+ vocabulary
  { word: 'meticulous', synonyms: ['careful', 'precise', 'thorough'], difficulty: 'Hard' },
  { word: 'abundant', synonyms: ['plentiful', 'copious', 'ample'], difficulty: 'Hard' },
  { word: 'benevolent', synonyms: ['kind', 'generous', 'charitable'], difficulty: 'Hard' },
  { word: 'tenacious', synonyms: ['persistent', 'determined', 'dogged'], difficulty: 'Hard' },
  { word: 'reluctant', synonyms: ['unwilling', 'hesitant', 'loath'], difficulty: 'Hard' },
  { word: 'candid', synonyms: ['honest', 'frank', 'truthful'], difficulty: 'Hard' },
  { word: 'diligent', synonyms: ['hardworking', 'industrious', 'assiduous'], difficulty: 'Hard' },
  { word: 'serene', synonyms: ['calm', 'peaceful', 'tranquil'], difficulty: 'Hard' },
  { word: 'obstinate', synonyms: ['stubborn', 'inflexible', 'headstrong'], difficulty: 'Hard' },
  { word: 'eloquent', synonyms: ['articulate', 'fluent', 'expressive'], difficulty: 'Hard' },

  // Easy — additional everyday words
  { word: 'quiet', synonyms: ['hushed', 'silent', 'still'], difficulty: 'Easy' },
  { word: 'clean', synonyms: ['tidy', 'spotless', 'neat'], difficulty: 'Easy' },
  { word: 'strong', synonyms: ['powerful', 'tough', 'mighty'], difficulty: 'Easy' },
  { word: 'funny', synonyms: ['amusing', 'comical', 'hilarious'], difficulty: 'Easy' },
  { word: 'loud', synonyms: ['noisy', 'booming', 'deafening'], difficulty: 'Easy' },
  { word: 'kind', synonyms: ['caring', 'gentle', 'considerate'], difficulty: 'Easy' },
  { word: 'easy', synonyms: ['simple', 'effortless', 'straightforward'], difficulty: 'Easy' },
  { word: 'old', synonyms: ['aged', 'elderly', 'antiquated'], difficulty: 'Easy' },
  { word: 'right', synonyms: ['correct', 'accurate', 'proper'], difficulty: 'Easy' },
  { word: 'wrong', synonyms: ['incorrect', 'mistaken', 'inaccurate'], difficulty: 'Easy' },

  // Medium — additional mid-tier vocabulary
  { word: 'cautious', synonyms: ['careful', 'wary', 'guarded'], difficulty: 'Medium' },
  { word: 'generous', synonyms: ['charitable', 'giving', 'magnanimous'], difficulty: 'Medium' },
  { word: 'peculiar', synonyms: ['odd', 'strange', 'curious'], difficulty: 'Medium' },
  { word: 'punctual', synonyms: ['prompt', 'timely', 'exact'], difficulty: 'Medium' },
  { word: 'transparent', synonyms: ['clear', 'see-through', 'translucent'], difficulty: 'Medium' },
  { word: 'cunning', synonyms: ['crafty', 'sly', 'devious'], difficulty: 'Medium' },
  { word: 'genuine', synonyms: ['authentic', 'real', 'sincere'], difficulty: 'Medium' },
  { word: 'hesitant', synonyms: ['uncertain', 'wavering', 'doubtful'], difficulty: 'Medium' },
  { word: 'brisk', synonyms: ['quick', 'lively', 'energetic'], difficulty: 'Medium' },
  { word: 'modest', synonyms: ['humble', 'unassuming', 'reserved'], difficulty: 'Medium' },

  // Hard — additional genuine 11+ vocabulary
  { word: 'ambiguous', synonyms: ['unclear', 'vague', 'equivocal'], difficulty: 'Hard' },
  { word: 'audacious', synonyms: ['bold', 'daring', 'brazen'], difficulty: 'Hard' },
  { word: 'loquacious', synonyms: ['talkative', 'garrulous', 'wordy'], difficulty: 'Hard' },
  { word: 'frugal', synonyms: ['thrifty', 'economical', 'sparing'], difficulty: 'Hard' },
  { word: 'inevitable', synonyms: ['unavoidable', 'certain', 'inescapable'], difficulty: 'Hard' },
  { word: 'pragmatic', synonyms: ['practical', 'sensible', 'realistic'], difficulty: 'Hard' },
  { word: 'resilient', synonyms: ['tough', 'adaptable', 'hardy'], difficulty: 'Hard' },
  { word: 'taciturn', synonyms: ['reserved', 'uncommunicative', 'reticent'], difficulty: 'Hard' },
  { word: 'voracious', synonyms: ['ravenous', 'insatiable', 'greedy'], difficulty: 'Hard' },
  { word: 'zealous', synonyms: ['enthusiastic', 'fervent', 'passionate'], difficulty: 'Hard' },
];
