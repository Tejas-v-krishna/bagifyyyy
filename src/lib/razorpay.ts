import crypto from 'crypto';

export function getRazorpayKeyId(): string | undefined {
  return process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
}

export function validateRazorpayConfig(): string | null {
  const keyId = getRazorpayKeyId();
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    return 'Razorpay is not configured. Set a Razorpay key ID and RAZORPAY_KEY_SECRET.';
  }
  return null;
}

export function verifyRazorpayWebhookSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'));
  } catch {
    return false;
  }
}

export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) return false;
  const payload = `${orderId}|${paymentId}`;
  const expected = crypto
    .createHmac('sha256', keySecret)
    .update(payload)
    .digest('hex');
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, 'hex'),
      Buffer.from(signature, 'hex')
    );
  } catch {
    return false;
  }
}

/** Best-effort reversal used when a captured payment cannot be allocated locally. */
export async function refundRazorpayPayment(params: {
  paymentId: string;
  amount: number;
  receipt: string;
}): Promise<boolean> {
  const keyId = getRazorpayKeyId();
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret || params.amount < 1) return false;

  try {
    const Razorpay = (await import('razorpay')).default;
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    await razorpay.payments.refund(params.paymentId, {
      amount: Math.round(params.amount),
      receipt: params.receipt.slice(0, 40),
    });
    return true;
  } catch (error) {
    console.error('Razorpay refund failed:', error);
    return false;
  }
}
