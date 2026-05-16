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

  // VERBAL REASONING LADDER
  { topic: 'Synonyms', subject: 'Verbal Reasoning' },
  { topic: 'Antonyms', subject: 'Verbal Reasoning' },
  { topic: 'Coding', subject: 'Verbal Reasoning', prerequisite: 'Synonyms' },
  { topic: 'Number Series', subject: 'Verbal Reasoning' },
]

export const MASTERY_THRESHOLD = 85
export const MIN_QUESTIONS_FOR_MASTERY = 50
