import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_secret) {
      return NextResponse.json(
        { error: 'Razorpay secret key not configured on server' },
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      order_id = razorpay_order_id,
      payment_id = razorpay_payment_id,
      signature = razorpay_signature,
    } = body;

    const orderIdToVerify = order_id || razorpay_order_id;
    const paymentIdToVerify = payment_id || razorpay_payment_id;
    const signatureToVerify = signature || razorpay_signature;

    // Validate presence of required fields
    if (!orderIdToVerify || !paymentIdToVerify || !signatureToVerify) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required payment verification fields (order_id, payment_id, signature)',
        },
        { status: 400 }
      );
    }

    // HMAC-SHA256 calculation: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
    const hmac = crypto.createHmac('sha256', key_secret);
    hmac.update(`${orderIdToVerify}|${paymentIdToVerify}`);
    const generatedSignature = hmac.digest('hex');

    // Constant-time signature comparison to prevent timing attacks
    let isSignatureValid = false;
    try {
      const genBuf = Buffer.from(generatedSignature, 'utf-8');
      const sigBuf = Buffer.from(signatureToVerify, 'utf-8');
      if (genBuf.length === sigBuf.length) {
        isSignatureValid = crypto.timingSafeEqual(genBuf, sigBuf);
      }
    } catch {
      isSignatureValid = false;
    }

    if (!isSignatureValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Payment verification failed: Signature mismatch',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      order_id: orderIdToVerify,
      payment_id: paymentIdToVerify,
    });
  } catch (error: any) {
    console.error('Razorpay verify-payment error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to verify payment',
      },
      { status: 500 }
    );
  }
}
