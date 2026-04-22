export interface ExamTip {
  id: string
  title: string
  content: string
  subject?: 'Maths' | 'English' | 'Verbal Reasoning'
  category: 'Time Management' | 'Accuracy' | 'Technique'
}

export const EXAM_TIPS: ExamTip[] = [
  {
    id: '30-sec-rule',
    title: 'The 30-Second Rule',
    content: 'In the 11+, you have about 30 seconds per question. If you are stuck for more than that, mark it and move on!',
    category: 'Time Management'
  },
  {
    id: 'mark-and-move',
    title: 'Mark and Move',
    content: 'Stuck? Put a small dash next to the question and move to the next one. Don’t let one hard question steal time from five easy ones.',
    category: 'Technique'
  },
  {
    id: 'keyword-underlining',
    title: 'Underline the "Not"',
    content: 'Many students lose marks by missing words like "NOT", "ALWAYS", or "ONLY". Underline them so they stand out!',
    category: 'Accuracy',
    subject: 'English'
  },
  {
    id: 'elimination-strat',
    title: 'Process of Elimination',
    content: 'Can’t find the right answer? Cross out the ones you know are definitely wrong. It makes your final guess much more likely to be right!',
    category: 'Technique'
  },
  {
    id: 'maths-estimation',
    title: 'Estimate First',
    content: 'Before calculating a complex Math problem, estimate the answer. If your final result is nowhere near your estimate, check your steps!',
    category: 'Accuracy',
    subject: 'Maths'
  },
  {
    id: 'read-questions-first',
    title: 'Scan Questions First',
    content: 'For long Comprehension passages, read the questions quickly before you read the text. You’ll know exactly what to look for!',
    category: 'Technique',
    subject: 'English'
  },
  {
    id: 'guess-to-win',
    title: 'Always Guess',
    content: 'There is no negative marking in 11+! If time is running out, fill in all your remaining choices. A guess is 25% likely to be a point—a blank is 0%.',
    category: 'Time Management'
  }
]
