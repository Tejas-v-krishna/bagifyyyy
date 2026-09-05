import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { completeRazorpayOrder, PaymentFinalizationError } from '@/lib/completeRazorpayOrder';
import { sendOrderConfirmationIfNeeded } from '@/lib/orderEmail';
import { verifyRazorpayWebhookSignature } from '@/lib/razorpay';

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-razorpay-signature');

  if (!verifyRazorpayWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
  }

  let event: {
    event?: string;
    payload?: {
      payment?: {
        entity?: {
          id?: string;
          order_id?: string;
          status?: string;
        };
      };
    };
  };
  try {
    event = JSON.parse(rawBody) as typeof event;
  } catch {
    return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 });
  }

  if (event.event !== 'payment.captured') {
    return NextResponse.json({ success: true, ignored: true });
  }

  const entity = event.payload?.payment?.entity;
  const paymentId = entity?.id;
  const razorpayOrderId = entity?.order_id;
  if (!paymentId || !razorpayOrderId) {
    return NextResponse.json({ error: 'Incomplete payment entity' }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { razorpayOrderId },
  });
  if (!order) {
    return NextResponse.json({ success: true, ignored: true });
  }
  if (order.paymentStatus === 'PAID') {
    await sendOrderConfirmationIfNeeded(order.id).catch(() => {});
    return NextResponse.json({ success: true, alreadyPaid: true });
  }

  try {
    const result = await completeRazorpayOrder({
      orderId: order.id,
      razorpayOrderId,
      paymentId,
      signature: `webhook:${paymentId}`,
    });
    await sendOrderConfirmationIfNeeded(result.orderId).catch(() => {});
    return NextResponse.json({ success: true, orderId: result.orderId });
  } catch (error) {
    if (error instanceof PaymentFinalizationError) {
      return NextResponse.json({ error: error.message, shortfall: error.shortfall }, { status: error.status });
    }
    console.error('Razorpay webhook error:', error);
    return NextResponse.json({ error: 'Failed to process webhook' }, { status: 500 });
  }
}
