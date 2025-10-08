// Test script to verify Stripe checkout API works with authentication
const fetch = require('node-fetch');

async function testCheckout() {
  console.log('Testing Stripe checkout API...\n');
  
  // First, we need to get a session token by logging in
  console.log('Step 1: Login to get session...');
  
  const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'rmxijvsrvjhixalshb@xfavaj.com',
      password: '99OpenAi%%'
    })
  });
  
  // Extract cookies from login response
  const cookies = loginResponse.headers.raw()['set-cookie'];
  console.log('Login response status:', loginResponse.status);
  console.log('Cookies received:', cookies ? 'Yes' : 'No');
  
  if (!cookies) {
    console.error('❌ No cookies received from login');
    return;
  }
  
  // Step 2: Call checkout API with cookies
  console.log('\nStep 2: Calling Stripe checkout API...');
  
  const checkoutResponse = await fetch('http://localhost:3000/api/stripe/checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookies.join('; ')
    },
    body: JSON.stringify({
      planId: 'single-monthly'
    })
  });
  
  const result = await checkoutResponse.json();
  
  console.log('Checkout API status:', checkoutResponse.status);
  console.log('Response:', JSON.stringify(result, null, 2));
  
  if (checkoutResponse.status === 200 && result.url) {
    console.log('\n✅ SUCCESS! Stripe checkout URL received:');
    console.log(result.url);
  } else if (checkoutResponse.status === 401) {
    console.log('\n❌ FAILED: 401 Unauthorized - Authentication not working');
  } else {
    console.log('\n❌ FAILED: Unexpected response');
  }
}

testCheckout().catch(console.error);
