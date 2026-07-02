// Verified-correct sentences for grammar/punctuation error-injection. Each
// error variant is hand-written and checked to differ from `correct` by
// exactly ONE genuine error — never a stylistic choice like the Oxford comma,
// which is optional in British English and must never be treated as wrong.
// This is what makes "only one option is correct" airtight: nothing is
// invented at generation time; every wrong version was authored and checked.

module.exports = [
  {
    correct: "It's a lovely day today.",
    difficulty: 'Easy',
    errors: {
      itsIts: "Its a lovely day today.", // missing apostrophe (its vs it's)
    },
  },
  {
    correct: "The dog wagged its tail happily.",
    difficulty: 'Easy',
    errors: {
      itsIts: "The dog wagged it's tail happily.", // wrong its/it's (opposite direction)
    },
  },
  {
    correct: "Where are my keys?",
    difficulty: 'Easy',
    errors: {
      missingQuestionMark: "Where are my keys.",
    },
  },
  {
    correct: "We are going to the park on Saturday.",
    difficulty: 'Easy',
    errors: {
      wrongCapital: "we are going to the park on Saturday.",
    },
  },
  {
    correct: "I can't wait to go on holiday!",
    difficulty: 'Easy',
    errors: {
      missingApostrophe: "I cant wait to go on holiday!",
    },
  },
  {
    correct: "She loves to dance, sing, and act.",
    difficulty: 'Easy',
    errors: {
      // A genuine error distinct from the Oxford-comma question: a missing
      // comma between the FIRST two items, not the optional final one.
      missingFirstComma: "She loves to dance sing, and act.",
    },
  },
  {
    correct: "The teacher said, \"Please be quiet.\"",
    difficulty: 'Medium',
    errors: {
      missingQuotes: "The teacher said, Please be quiet.",
    },
  },
  {
    correct: "We went to the park, and then we had ice cream.",
    difficulty: 'Medium',
    errors: {
      // Comma splice: two independent clauses joined by only a comma, no conjunction.
      commaSplice: "We went to the park, then we had ice cream.",
    },
  },
  {
    correct: "Michael's book is on the table.",
    difficulty: 'Medium',
    errors: {
      missingApostrophe: "Michaels book is on the table.",
    },
  },
  {
    correct: "The dogs' leads were tangled together.",
    difficulty: 'Medium',
    errors: {
      // Wrong possessive form: singular 's instead of plural s'.
      wrongApostrophePosition: "The dog's leads were tangled together.",
    },
  },
  {
    correct: "He doesn't like broccoli.",
    difficulty: 'Medium',
    errors: {
      subjectVerb: "He don't like broccoli.",
    },
  },
  {
    correct: "Neither of the boys has finished his homework.",
    difficulty: 'Hard',
    errors: {
      subjectVerb: "Neither of the boys have finished his homework.",
    },
  },
  {
    correct: "The team, which had trained for months, won the final.",
    difficulty: 'Hard',
    errors: {
      // Missing the SECOND comma of a paired non-restrictive clause.
      missingCommaPair: "The team, which had trained for months won the final.",
    },
  },
  {
    correct: "It's been a long day, hasn't it?",
    difficulty: 'Hard',
    errors: {
      itsIts: "Its been a long day, hasn't it?",
    },
  },
  {
    correct: "The results were surprising; nobody had expected them.",
    difficulty: 'Hard',
    errors: {
      commaForSemicolon: "The results were surprising, nobody had expected them.",
    },
  },
  {
    correct: "Whose turn is it to read next?",
    difficulty: 'Hard',
    errors: {
      whosWhose: "Who's turn is it to read next?",
    },
  },
  {
    correct: "Between you and me, this is a secret.",
    difficulty: 'Hard',
    errors: {
      // Wrong pronoun case after a preposition ("I" instead of "me").
      pronounCase: "Between you and I, this is a secret.",
    },
  },
];
