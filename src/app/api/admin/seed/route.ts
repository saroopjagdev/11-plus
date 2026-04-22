import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// We use the service role key to bypass RLS for seeding
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const SAMPLE_QUESTIONS = [
  // MATHS
  {
    subject: 'Maths',
    topic: 'Fractions',
    difficulty: 'Easy',
    question_text: 'What is 1/4 of 60?',
    options: ['10', '12', '15', '20'],
    correct_answer: '15'
  },
  {
    subject: 'Maths',
    topic: 'Fractions',
    difficulty: 'Medium',
    question_text: 'Which of these fractions is equivalent to 2/3?',
    options: ['4/6', '3/4', '2/4', '5/9'],
    correct_answer: '4/6'
  },
  {
    subject: 'Maths',
    topic: 'Decimals',
    difficulty: 'Easy',
    question_text: 'What is 0.75 as a fraction in its simplest form?',
    options: ['1/2', '3/4', '2/3', '4/5'],
    correct_answer: '3/4'
  },
  {
    subject: 'Maths',
    topic: 'Geometry',
    difficulty: 'Hard',
    question_text: 'How many degrees are in the sum of the interior angles of a pentagon?',
    options: ['360°', '540°', '720°', '180°'],
    correct_answer: '540°'
  },
  {
    subject: 'Maths',
    topic: 'Time',
    difficulty: 'Medium',
    question_text: 'A train leaves at 08:45 and arrives at 10:12. How long was the journey?',
    options: ['1 hour 17 mins', '1 hour 27 mins', '1 hour 37 mins', '1 hour 7 mins'],
    correct_answer: '1 hour 27 mins'
  },

  // ENGLISH
  {
    subject: 'English',
    topic: 'Synonyms',
    difficulty: 'Easy',
    question_text: 'Choose the synonym for "Vast":',
    options: ['Small', 'Huge', 'Pretty', 'Quick'],
    correct_answer: 'Huge'
  },
  {
    subject: 'English',
    topic: 'Antonyms',
    difficulty: 'Medium',
    question_text: 'What is the antonym of "Generous"?',
    options: ['Kind', 'Stingy', 'Happy', 'Brave'],
    correct_answer: 'Stingy'
  },
  {
    subject: 'English',
    topic: 'Spelling',
    difficulty: 'Hard',
    question_text: 'Which of these is the correct spelling?',
    options: ['Accomodation', 'Accommodation', 'Acommodation', 'Accomodasion'],
    correct_answer: 'Accommodation'
  },
  {
    subject: 'English',
    topic: 'Grammar',
    difficulty: 'Medium',
    question_text: 'Which sentence is grammatically correct?',
    options: [
      'They was going to the park.',
      'Their going to the park.',
      'They are going to the park.',
      'There going to the park.'
    ],
    correct_answer: 'They are going to the park.'
  },

  // VERBAL REASONING
  {
    subject: 'Verbal Reasoning',
    topic: 'Word Completion',
    difficulty: 'Easy',
    question_text: 'Find the hidden word that completes the first word and starts the second: HAND ( _ _ _ ) SHIP',
    options: ['BAG', 'GUN', 'TEN', 'PEN'],
    correct_answer: 'GUN'
  },
  {
    subject: 'Verbal Reasoning',
    topic: 'Letter Sequences',
    difficulty: 'Medium',
    question_text: 'What is the next letter in the sequence? A, C, E, G, ...',
    options: ['H', 'I', 'J', 'K'],
    correct_answer: 'I'
  }
]

export async function GET(request: Request) {
  // Simple protection: Check for a secret header or just allow for now during development
  const { searchParams } = new URL(request.url)
  const key = searchParams.get('key')

  if (process.env.NODE_ENV === 'production' && key !== 'your-secret-seed-key') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 1. Clear existing questions (optional, be careful!)
    // const { error: deleteError } = await supabaseAdmin.from('questions').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    
    // 2. Insert sample questions
    const { data, error } = await supabaseAdmin
      .from('questions')
      .insert(SAMPLE_QUESTIONS)
      .select()

    if (error) throw error

    return NextResponse.json({ 
      message: 'Successfully seeded questions!', 
      count: data.length,
      questions: data 
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
