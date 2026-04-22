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

async function checkQuestions() {
  const { data, error } = await supabase
    .from('questions')
    .select('subject, topic, question_text')
    .limit(20);

  if (error) {
    console.error('Error fetching questions:', error);
    return;
  }

  console.log('--- Questions Sample (Total: ' + data.length + ') ---');
  data.forEach((q, i) => {
    console.log(`${i+1}. [${q.subject} > ${q.topic}] ${q.question_text.substring(0, 80)}...`);
  });
}

checkQuestions();
