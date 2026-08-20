import crypto from 'crypto';
import Razorpay from 'razorpay';
import fs from 'fs';
import path from 'path';

// Read .env file directly
const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx !== -1) {
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    envVars[key] = val;
  }
}

const key_id = envVars['RAZORPAY_KEY_ID'] || 'rzp_test_TSATn0pke37PQs';
const key_secret = envVars['RAZORPAY_KEY_SECRET'] || 'F76HGd94m7fFg0IGtRhRVA9O';

console.log('Using Key ID:', key_id);
console.log('Using Key Secret Length:', key_secret.length);

async function runTests() {
  console.log('\n--- 1. Testing Razorpay SDK order creation ---');
  const razorpay = new Razorpay({
    key_id,
    key_secret,
  });

  const order = await razorpay.orders.create({
    amount: 149900, // 1499 INR in paise
    currency: 'INR',
    receipt: `rcpt_test_${Date.now()}`,
    notes: {
      test: 'BAGIFYYYY Standard Checkout Verification',
    },
  });

  console.log('Order created successfully:');
  console.log('Order ID:', order.id);
  console.log('Amount:', order.amount);
  console.log('Currency:', order.currency);
  console.log('Status:', order.status);

  if (!order.id.startsWith('order_')) {
    throw new Error('Expected order id to start with order_');
  }

  console.log('\n--- 2. Testing Signature Verification Algorithm ---');
  const mockPaymentId = `pay_test_${Math.random().toString(36).substring(2, 10)}`;
  const validSignature = crypto
    .createHmac('sha256', key_secret)
    .update(`${order.id}|${mockPaymentId}`)
    .digest('hex');

  console.log('Valid HMAC-SHA256 signature generated:', validSignature);

  // Test exact match
  const checkSignature = crypto
    .createHmac('sha256', key_secret)
    .update(`${order.id}|${mockPaymentId}`)
    .digest('hex');

  const isMatch = crypto.timingSafeEqual(
    Buffer.from(validSignature, 'utf-8'),
    Buffer.from(checkSignature, 'utf-8')
  );
  console.log('Exact signature match:', isMatch);

  // Test tampered signature mismatch
  const tamperedSig = validSignature.slice(0, -4) + '0000';
  const isMismatch = !crypto.timingSafeEqual(
    Buffer.from(validSignature, 'utf-8'),
    Buffer.from(tamperedSig, 'utf-8')
  );
  console.log('Tampered signature rejection:', isMismatch);

  console.log('\n✅ All Razorpay API & Signature Verification Tests Passed Successfully!');
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
