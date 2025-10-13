// Test script for AI Analysis webhook
// Usage: node test-ai-webhook.js

const fetch = require('node-fetch');

async function testWebhook() {
  // Using existing property from database: 555 Washington Ave, Brooklyn, NY
  const TEST_PROPERTY_ID = 'c4071bf5-a4ae-4f70-8aea-e4b8513dd7fb';
  
  const API_URL = 'http://localhost:3000/api/ai-analysis/trigger';
  
  console.log('🧪 Testing AI Analysis Webhook...\n');
  console.log('API URL:', API_URL);
  console.log('Property ID:', TEST_PROPERTY_ID);
  console.log('\n---\n');

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        property_id: TEST_PROPERTY_ID
      })
    });

    const data = await response.json();

    console.log('Response Status:', response.status);
    console.log('Response Body:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('\n✅ SUCCESS!');
      console.log('Analysis ID:', data.analysis_id);
      console.log('\nCheck your n8n webhook logs to see if the data arrived.');
      console.log('\nTo check the analysis status, run:');
      console.log(`  SELECT * FROM ai_property_analyses WHERE id = '${data.analysis_id}';`);
    } else {
      console.log('\n❌ ERROR:', data.error);
    }
  } catch (error) {
    console.error('\n❌ Request failed:', error.message);
  }
}

testWebhook();

