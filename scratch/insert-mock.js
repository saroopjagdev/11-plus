const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Simple .env.local parser
const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    env[key.trim()] = valueParts.join('=').trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function insertMock() {
  const { data, error } = await supabase
    .from('questions')
    .insert([
      {
        subject: 'English',
        topic: 'Comprehension',
        difficulty: 'Medium',
        // Omit 'type' since we can't alter the remote DB schema directly right now
        question_text: 'Read the following passage: "The old house sat on the hill, its windows dark and uninviting. The wind howled through the broken eaves like a restless spirit." \n\nExplain how the author creates a spooky atmosphere in this passage.',
        options: [], // Empty array signifies a written question
        correct_answer: 'The author uses words like "dark and uninviting" and "broken eaves". They also use a simile comparing the wind to a "restless spirit" and personification by saying the wind "howled".'
      }
    ])
    .select();

  if (error) {
    console.error('Error inserting mock question:', error);
  } else {
    console.log('Successfully inserted mock written question:', data);
  }
}

insertMock();
