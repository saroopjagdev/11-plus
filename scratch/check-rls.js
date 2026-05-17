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
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRLS() {
  console.log('Checking RLS policies on profiles table...');
  const { data, error } = await supabase.rpc('pg_execute', {
    query: "SELECT tablename, policyname, permissive, roles, cmd, qual, with_check FROM pg_policies WHERE tablename = 'profiles'"
  });

  if (error) {
    // If pg_execute RPC doesn't exist, try a direct query
    const { data: directData, error: directError } = await supabase
      .from('profiles')
      .select('id, email, referral_code');
    console.log('Direct select using service key worked. Current profiles:', directData);
    console.log('Error querying policies directly (normal if no custom RPC):', error);
  } else {
    console.log('Policies:', data);
  }
}

checkRLS();
