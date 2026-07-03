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

  {
    correct: "I have two brothers and one sister.",
    difficulty: 'Easy',
    errors: {
      wrongCapital: "i have two brothers and one sister.",
    },
  },
  {
    correct: "The cat sat on the mat.",
    difficulty: 'Easy',
    errors: {
      missingFullStop: "The cat sat on the mat",
    },
  },
  {
    correct: "Can you pass the salt, please?",
    difficulty: 'Easy',
    errors: {
      missingQuestionMark: "Can you pass the salt, please.",
    },
  },
  {
    correct: "There is a spider on the wall.",
    difficulty: 'Easy',
    errors: {
      // their/there confusion
      theirThere: "Their is a spider on the wall.",
    },
  },
  {
    correct: "You're going to love this film.",
    difficulty: 'Easy',
    errors: {
      // your/you're confusion
      yourYoure: "Your going to love this film.",
    },
  },
  {
    correct: "They're bringing their dog to the park.",
    difficulty: 'Medium',
    errors: {
      // they're/their confusion
      theyreTheir: "Their bringing their dog to the park.",
    },
  },
  {
    correct: "I would have gone if I had known.",
    difficulty: 'Medium',
    errors: {
      // "would of" is a genuine, common non-standard error for "would have".
      wouldOf: "I would of gone if I had known.",
    },
  },
  {
    correct: "The books, which were overdue, were returned today.",
    difficulty: 'Medium',
    errors: {
      missingCommaPair: "The books, which were overdue were returned today.",
    },
  },
  {
    correct: "Everybody needs to bring their own lunch.",
    difficulty: 'Medium',
    errors: {
      subjectVerb: "Everybody need to bring their own lunch.",
    },
  },
  {
    correct: "The two friends walked to school together, chatting all the way.",
    difficulty: 'Medium',
    errors: {
      // Comma splice: two independent clauses joined by only a comma.
      commaSplice: "The two friends walked to school together, they chatted all the way.",
    },
  },
  {
    correct: "Had I known, I would have come earlier.",
    difficulty: 'Hard',
    errors: {
      wouldOf: "Had I known, I would of come earlier.",
    },
  },
  {
    correct: "The committee, having discussed the matter thoroughly, reached a decision.",
    difficulty: 'Hard',
    errors: {
      missingCommaPair: "The committee, having discussed the matter thoroughly reached a decision.",
    },
  },
  {
    correct: "Its sudden change of direction surprised everyone.",
    difficulty: 'Hard',
    errors: {
      itsIts: "It's sudden change of direction surprised everyone.",
    },
  },
  {
    correct: "The evidence was compelling; the jury reached a verdict swiftly.",
    difficulty: 'Hard',
    errors: {
      commaForSemicolon: "The evidence was compelling, the jury reached a verdict swiftly.",
    },
  },
  {
    correct: "Whom did you invite to the party?",
    difficulty: 'Hard',
    errors: {
      // Formal object case: "whom" (object) vs "who" (subject).
      whoWhom: "Who did you invite to the party?",
    },
  },

  {
    correct: "I don't want any more, thank you.",
    difficulty: 'Easy',
    errors: {
      doubleNegative: "I don't want no more, thank you.",
    },
  },
  {
    correct: "She and I went to the shop.",
    difficulty: 'Easy',
    errors: {
      pronounCase: "Her and me went to the shop.",
    },
  },
  {
    correct: "The weather was cold, so we wore coats.",
    difficulty: 'Medium',
    errors: {
      // Comma splice: missing conjunction between two independent clauses.
      commaSplice: "The weather was cold, we wore coats.",
    },
  },
  {
    correct: "Each of the students has a locker.",
    difficulty: 'Medium',
    errors: {
      subjectVerb: "Each of the students have a locker.",
    },
  },
  {
    correct: "The reason he left was that he felt unwell.",
    difficulty: 'Hard',
    errors: {
      // "reason...because" is redundant; the taught correct form is "reason...that".
      reasonBecause: "The reason he left was because he felt unwell.",
    },
  },
  {
    correct: "Fewer people attended this year than last.",
    difficulty: 'Hard',
    errors: {
      // fewer (countable) vs less (uncountable) — a commonly taught distinction.
      fewerLess: "Less people attended this year than last.",
    },
  },
];
