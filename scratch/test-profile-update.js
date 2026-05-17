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
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpdate() {
  const userId = '6f07ea98-346a-4eac-a7fc-c6fecb7a57f6';
  console.log(`Updating profile for user: ${userId}`);
  const { data, error } = await supabase
    .from('profiles')
    .update({ referral_code: 'SAROOPWARWICK' })
    .eq('id', userId)
    .select();

  if (error) {
    console.error('Error updating profile:', error);
  } else {
    console.log('Update successful! Result:', data);
  }
}

testUpdate();
