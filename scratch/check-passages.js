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

async function check() {
  console.log('Querying questions with passage_id...');
  
  const { data, error } = await supabase
    .from('questions')
    .select('id, topic, subject, passage_id')
    .not('passage_id', 'is', null);

  if (error) {
    console.error('Error fetching questions with passage_id:', error);
  } else {
    console.log(`Found ${data.length} questions linked to a passage.`);
    console.log('First 5 sample rows:', data.slice(0, 5));
  }

  // Also query questions where topic is 'Comprehension'
  const { data: compData, error: compError } = await supabase
    .from('questions')
    .select('id, topic, subject, passage_id')
    .eq('topic', 'Comprehension');

  if (compError) {
    console.error('Error fetching Comprehension:', compError);
  } else {
    console.log(`Found ${compData.length} questions with topic "Comprehension".`);
    console.log('Comprehension sample rows:', compData.slice(0, 5));
  }
}

check();
