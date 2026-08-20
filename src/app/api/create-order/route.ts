import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';

export async function POST(request: Request) {
  try {
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
      return NextResponse.json(
        { error: 'Razorpay credentials not configured on server' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    let { amount, currency = 'INR', receipt, notes } = body;

    // Validate amount
    if (amount === undefined || amount === null || typeof amount !== 'number' || isNaN(amount)) {
      return NextResponse.json(
        { error: 'Invalid amount. Amount must be a valid number in paise.' },
        { status: 400 }
      );
    }

    // Amount must be in paise and at least 100 paise (₹1.00)
    if (amount < 100) {
      return NextResponse.json(
        { error: 'Minimum amount must be at least 100 paise (₹1.00)' },
        { status: 400 }
      );
    }

    const razorpay = new Razorpay({
      key_id,
      key_secret,
    });

    const options: any = {
      amount: Math.round(amount),
      currency: currency || 'INR',
      receipt: receipt || `rcpt_${Date.now()}`,
    };

    if (notes && typeof notes === 'object') {
      options.notes = notes;
    }

    const order = await razorpay.orders.create(options);

    return NextResponse.json({
      success: true,
      order_id: order.id,
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || key_id,
    });
  } catch (error: any) {
    console.error('Razorpay create-order error:', error);
    const statusCode = error.statusCode || (error.error?.code === 'BAD_REQUEST_ERROR' ? 400 : 500);
    return NextResponse.json(
      {
        error: error.error?.description || error.message || 'Failed to create Razorpay order',
      },
      { status: statusCode }
    );
  }
}
