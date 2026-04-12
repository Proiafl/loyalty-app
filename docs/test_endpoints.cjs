const https = require('https');

const SUPABASE_URL = 'qcrdbhbxcyqeyxwwhaiv.supabase.co';

async function testWebhookSignature() {
  console.log('--- Testing mp-webhook (Signature Validation) ---');
  return new Promise((resolve) => {
    const req = https.request({
      hostname: SUPABASE_URL,
      path: '/functions/v1/mp-webhook?type=payment',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Intentional fake signature to trigger 401 block
        'x-signature': 'ts=1000000000,v1=abcdef1234567890',
        'x-request-id': 'test-request-id'
      }
    }, res => {
      console.log('Webhook Status Code (Fake Sig):', res.statusCode);
      if (res.statusCode === 401) {
        console.log('✅ Webhook correctly REJECTED fake signature (401)');
      } else {
        console.log('❌ Webhook did not reject or behaved unexpectedly.');
      }
      res.on('data', () => {});
      res.on('end', resolve);
    });
    
    req.write(JSON.stringify({ data: { id: '999' } }));
    req.end();
  });
}

async function testCheckoutCORS() {
  console.log('\n--- Testing mp-checkout (CORS & Restrict Method) ---');
  return new Promise((resolve) => {
    const req = https.request({
      hostname: SUPABASE_URL,
      path: '/functions/v1/mp-checkout',
      method: 'GET', // testing wrong method
      headers: {
        'origin': 'https://loyaltyapp.futuwebs.com'
      }
    }, res => {
      console.log('Checkout GET Status Code:', res.statusCode);
      if (res.statusCode === 405) {
         console.log('✅ Checkout correctly BLOCKED GET request (405)');
      } else {
         console.log('❌ Checkout did not return 405 for GET');
      }
      res.on('data', () => {});
      res.on('end', resolve);
    });
    req.end();
  });
}

async function main() {
  await testWebhookSignature();
  await testCheckoutCORS();
}

main();
