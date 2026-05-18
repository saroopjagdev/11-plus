const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    env[key.trim()] = valueParts.join('=').trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkQuestions() {
  console.log('Fetching sample questions...');
  
  // Fetch sample questions across different topics, especially English/Comprehension
  const { data: questions, error } = await supabase
    .from('questions')
    .select('*')
    .limit(10);

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Sample Questions:', questions);
  }

  // Let's also check distinct topics in the DB
  const { data: topics, error: topicsError } = await supabase
    .from('questions')
    .select('topic, subject');
  
  if (topicsError) {
    console.error('Error fetching topics:', topicsError);
  } else {
    const uniqueTopics = [...new Set(topics.map(t => `${t.subject} - ${t.topic}`))];
    console.log('Unique topics in DB:', uniqueTopics);
  }
}

checkQuestions();
