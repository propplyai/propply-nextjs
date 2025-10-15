/**
 * Test script for AI Analysis Trigger
 * Tests the /api/ai-analysis/trigger endpoint locally
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables from .env.local if it exists
try {
  require('dotenv').config({ path: '.env.local' });
} catch (e) {
  console.log('⚠️  dotenv not installed, using process.env directly');
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testAITrigger() {
  console.log('🧪 Testing AI Analysis Trigger\n');

  // Step 1: Check environment variables
  console.log('1️⃣ Checking environment variables...');
  const requiredEnvs = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'N8N_WEBHOOK_URL'
  ];

  const missingEnvs = requiredEnvs.filter(env => !process.env[env]);
  if (missingEnvs.length > 0) {
    console.error('❌ Missing environment variables:', missingEnvs.join(', '));
    console.log('\n📝 Add these to your .env.local file:');
    missingEnvs.forEach(env => console.log(`${env}=...`));
    return;
  }
  console.log('✅ All environment variables present\n');

  // Step 2: Get a test property
  console.log('2️⃣ Fetching test property...');
  const { data: properties, error: propsError } = await supabase
    .from('properties')
    .select('id, user_id, address, city')
    .limit(1);

  if (propsError || !properties || properties.length === 0) {
    console.error('❌ No properties found in database');
    console.log('Please add a property first');
    return;
  }

  const testProperty = properties[0];
  console.log('✅ Found test property:', testProperty.address);
  console.log('   Property ID:', testProperty.id);
  console.log('   User ID:', testProperty.user_id);
  console.log('');

  // Step 3: Check for subscription
  console.log('3️⃣ Checking for active subscription...');
  const { data: subscription, error: subError } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', testProperty.user_id)
    .eq('status', 'active')
    .single();

  if (subError || !subscription) {
    console.warn('⚠️  No active subscription found for user');
    console.log('   The API will reject the request');
    console.log('   You may need to add a test subscription or skip this check\n');
  } else {
    console.log('✅ Active subscription found');
    console.log('   Plan:', subscription.plan_name);
    console.log('');
  }

  // Step 4: Check for existing analyses
  console.log('4️⃣ Checking for existing analyses...');
  const { data: existingAnalyses, error: analysesError } = await supabase
    .from('ai_property_analyses')
    .select('id, status, created_at')
    .eq('property_id', testProperty.id)
    .order('created_at', { ascending: false })
    .limit(1);

  if (existingAnalyses && existingAnalyses.length > 0) {
    console.log('ℹ️  Found existing analysis:');
    console.log('   ID:', existingAnalyses[0].id);
    console.log('   Status:', existingAnalyses[0].status);
    console.log('   Created:', existingAnalyses[0].created_at);
    console.log('');
  } else {
    console.log('ℹ️  No existing analyses found\n');
  }

  // Step 5: Test the API endpoint
  console.log('5️⃣ Testing API endpoint...');
  console.log('   Endpoint: http://localhost:3000/api/ai-analysis/trigger');
  console.log('   Method: POST');
  console.log('   Payload:', JSON.stringify({ property_id: testProperty.id }, null, 2));
  console.log('');

  try {
    const response = await fetch('http://localhost:3000/api/ai-analysis/trigger', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        property_id: testProperty.id
      })
    });

    console.log('📡 Response Status:', response.status, response.statusText);

    const data = await response.json();
    console.log('📦 Response Data:', JSON.stringify(data, null, 2));
    console.log('');

    if (response.ok) {
      console.log('✅ API request successful!');
      console.log('   Analysis ID:', data.analysis_id);
      console.log('   Status:', data.status);
      console.log('');

      // Check if record was created
      if (data.analysis_id) {
        console.log('6️⃣ Verifying database record...');
        const { data: analysis, error: checkError } = await supabase
          .from('ai_property_analyses')
          .select('*')
          .eq('id', data.analysis_id)
          .single();

        if (checkError) {
          console.error('❌ Error fetching analysis:', checkError.message);
        } else {
          console.log('✅ Analysis record created in database');
          console.log('   Status:', analysis.status);
          console.log('   Property ID:', analysis.property_id);
          console.log('');
        }
      }

      // Check if webhook was called
      console.log('7️⃣ Webhook configuration:');
      console.log('   URL:', process.env.N8N_WEBHOOK_URL);
      console.log('   ⚠️  Check your webhook logs to confirm it was called');
      console.log('');

      console.log('🎉 Test completed successfully!');
      console.log('');
      console.log('Next steps:');
      console.log('1. Check your webhook service logs');
      console.log('2. Verify the webhook received the payload');
      console.log('3. Monitor the ai_property_analyses table for status updates');
    } else {
      console.error('❌ API request failed');
      console.error('   Error:', data.error || 'Unknown error');

      if (data.upgrade_required) {
        console.log('');
        console.log('💡 Solution: Add an active subscription for user:', testProperty.user_id);
        console.log('   OR temporarily disable subscription check in API route');
      }
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
    console.log('');
    console.log('💡 Make sure your dev server is running: npm run dev');
  }
}

// Run the test
testAITrigger().catch(console.error);
