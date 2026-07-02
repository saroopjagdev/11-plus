export interface TopicPrerequisite {
  topic: string
  subject: 'Maths' | 'English' | 'Verbal Reasoning'
  prerequisite?: string // Topic that must be mastered first
}

export const CURRICULUM_LADDER: TopicPrerequisite[] = [
  // MATHS LADDER
  { topic: 'Arithmetic', subject: 'Maths' },
  { topic: 'Fractions', subject: 'Maths', prerequisite: 'Arithmetic' },
  { topic: 'Decimals', subject: 'Maths', prerequisite: 'Fractions' },
  { topic: 'Percentages', subject: 'Maths', prerequisite: 'Decimals' },
  { topic: 'Ratio & Proportion', subject: 'Maths', prerequisite: 'Percentages' },
  { topic: 'Algebra', subject: 'Maths', prerequisite: 'Arithmetic' },
  { topic: 'Geometry', subject: 'Maths', prerequisite: 'Arithmetic' },
  { topic: 'Data Interpretation', subject: 'Maths', prerequisite: 'Arithmetic' },

  // ENGLISH LADDER
  { topic: 'Punctuation', subject: 'English' },
  { topic: 'Spelling', subject: 'English' },
  { topic: 'Grammar', subject: 'English', prerequisite: 'Punctuation' },
  { topic: 'Vocabulary', subject: 'English' },
  { topic: 'Comprehension', subject: 'English', prerequisite: 'Vocabulary' },

  // ENGLISH LADDER (new topics)
  { topic: 'Cloze', subject: 'English', prerequisite: 'Vocabulary' },

  // VERBAL REASONING LADDER
  { topic: 'Synonyms', subject: 'Verbal Reasoning' },
  { topic: 'Antonyms', subject: 'Verbal Reasoning' },
  { topic: 'Coding', subject: 'Verbal Reasoning', prerequisite: 'Synonyms' },
  { topic: 'Number Series', subject: 'Verbal Reasoning' },
  { topic: 'Analogies', subject: 'Verbal Reasoning', prerequisite: 'Synonyms' },
  { topic: 'Odd One Out', subject: 'Verbal Reasoning' },
  { topic: 'Anagrams', subject: 'Verbal Reasoning' },
  { topic: 'Compound Words', subject: 'Verbal Reasoning' },
  { topic: 'Move-a-Letter', subject: 'Verbal Reasoning', prerequisite: 'Anagrams' },
  { topic: 'Hidden Words', subject: 'Verbal Reasoning' },
]

export const MASTERY_TIERS = [
  { level: 1, label: 'Bronze', minAccuracy: 80, minQuestions: 20, color: 'text-orange-600', bgColor: 'bg-orange-50' },
  { level: 2, label: 'Silver', minAccuracy: 85, minQuestions: 100, color: 'text-slate-500', bgColor: 'bg-slate-50' },
  { level: 3, label: 'Gold', minAccuracy: 90, minQuestions: 250, color: 'text-amber-600', bgColor: 'bg-amber-50' },
  { level: 4, label: 'Platinum', minAccuracy: 95, minQuestions: 500, color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
  { level: 5, label: 'Diamond', minAccuracy: 98, minQuestions: 1000, color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
]

export const MASTERY_THRESHOLD = 85
export const MIN_QUESTIONS_FOR_MASTERY = 20 // Level 1 threshold
