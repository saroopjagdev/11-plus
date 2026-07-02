// Spelling data: the correct spelling plus real common misspellings used as
// distractors. Verified so only one option is correctly spelled. Four
// misspellings per word so the option set can be a full 4+1.

module.exports = [
  { correct: 'friend', misspellings: ['freind', 'frend', 'friennd', 'freend'], difficulty: 'Easy' },
  { correct: 'because', misspellings: ['becuase', 'becase', 'becouse', 'beacause'], difficulty: 'Easy' },
  { correct: 'people', misspellings: ['peaple', 'peeple', 'pepole', 'poeple'], difficulty: 'Easy' },
  { correct: 'beautiful', misspellings: ['beutiful', 'beautifull', 'beatiful', 'beautifil'], difficulty: 'Easy' },
  { correct: 'address', misspellings: ['adress', 'addres', 'adres', 'addresss'], difficulty: 'Easy' },

  { correct: 'necessary', misspellings: ['neccessary', 'necesary', 'nessecary', 'neccesary'], difficulty: 'Medium' },
  { correct: 'separate', misspellings: ['seperate', 'separete', 'sepatate', 'seprate'], difficulty: 'Medium' },
  { correct: 'definitely', misspellings: ['definately', 'definitly', 'defiantly', 'definitley'], difficulty: 'Medium' },
  { correct: 'business', misspellings: ['buisness', 'bussiness', 'busness', 'bisness'], difficulty: 'Medium' },
  { correct: 'grammar', misspellings: ['grammer', 'gramar', 'grammor', 'gramma'], difficulty: 'Medium' },

  { correct: 'occurrence', misspellings: ['occurrance', 'occurence', 'ocurrence', 'occurrense'], difficulty: 'Hard' },
  { correct: 'conscience', misspellings: ['concience', 'conscence', 'consciense', 'conshence'], difficulty: 'Hard' },
  { correct: 'rhythm', misspellings: ['rythm', 'rhythim', 'rhytmm', 'rythem'], difficulty: 'Hard' },
  { correct: 'mischievous', misspellings: ['mischievious', 'mischevous', 'mischeivous', 'mischeivious'], difficulty: 'Hard' },
  { correct: 'embarrass', misspellings: ['embarass', 'embaras', 'embarras', 'embarasses'], difficulty: 'Hard' },
];
