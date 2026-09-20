import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { prisma } from '@/lib/prisma';
import { completeRazorpayOrder, PaymentFinalizationError } from '@/lib/completeRazorpayOrder';
import { recoverCapturedPayment } from '@/lib/paymentRecovery';
import { sendOrderConfirmationIfNeeded, alertManualRefundRequired } from '@/lib/orderEmail';
import { getRazorpayKeyId, validateRazorpayConfig, verifyRazorpaySignature, refundRazorpayPayment } from '@/lib/razorpay';

function statusFromStatus(status: string | undefined, fallback: number): number {
  if (status === 'AWAITING_PAYMENT' || status === 'PENDING') return 409;
  if (status === 'PAID') return 200;
  return fallback;
}

export async function POST(request: Request) {
  const configError = validateRazorpayConfig();
  if (configError) {
    return NextResponse.json({ error: configError }, { status: 503 });
  }

  let payload: {
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
    orderId?: string;
  };

  try {
    payload = (await request.json()) as typeof payload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = payload;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
    return NextResponse.json(
      { error: 'razorpay_order_id, razorpay_payment_id, razorpay_signature and orderId are required' },
      { status: 400 }
    );
  }

  if (!verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
    return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }
  if (order.razorpayOrderId !== razorpay_order_id) {
    return NextResponse.json({ error: 'Payment does not belong to this order' }, { status: 400 });
  }

  if (order.paymentStatus === 'PAID') {
    await sendOrderConfirmationIfNeeded(order.id).catch(() => {});
    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      message: 'Payment already verified',
    });
  }
  if (order.paymentStatus !== 'PENDING') {
    return NextResponse.json(
      { error: `This order cannot accept payments (status: ${order.paymentStatus})` },
      { status: statusFromStatus(order.paymentStatus, 409) }
    );
  }

  const keyId = getRazorpayKeyId();
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    return NextResponse.json({ error: 'Razorpay is not configured.' }, { status: 503 });
  }

  let payment: { order_id?: string; status?: string; amount?: number | string };
  try {
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    payment = await razorpay.payments.fetch(razorpay_payment_id);
  } catch (providerError) {
    console.error('Razorpay payment fetch failed:', providerError);
    return NextResponse.json(
      { error: 'Could not confirm payment with the payment provider' },
      { status: 502 }
    );
  }

  if (payment.order_id !== razorpay_order_id) {
    return NextResponse.json({ error: 'Payment does not belong to this order' }, { status: 400 });
  }
  if (payment.status !== 'captured') {
    return NextResponse.json(
      { error: `Payment is not captured (status: ${payment.status || 'unknown'})` },
      { status: 409 }
    );
  }

  const expectedPaise = Math.round(order.totalAmount * 100);
  if (Number(payment.amount) !== expectedPaise) {
    const recovery = await recoverCapturedPayment({
      orderId: order.id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
      amountInPaise: Number(payment.amount) || expectedPaise,
      receipt: order.orderNumber,
    }).catch(() => 'REFUND_PENDING' as const);
    console.error(
      `Payment amount mismatch on order ${order.orderNumber}: captured ${payment.amount}, expected ${expectedPaise}. Recovery: ${recovery}`
    );
    if (recovery !== 'REFUNDED') {
      await alertManualRefundRequired({
        paymentId: razorpay_payment_id,
        orderNumber: order.orderNumber,
        amountInPaise: Number(payment.amount) || expectedPaise,
        reason: 'Captured amount did not match the order total and the automatic refund failed.',
      });
    }
    return NextResponse.json(
      {
        error:
          recovery === 'REFUNDED'
            ? 'Paid amount did not match the order total. The payment has been refunded.'
            : 'Paid amount did not match the order total. Support will review this payment.',
      },
      { status: 400 }
    );
  }

  try {
    const result = await completeRazorpayOrder({
      orderId: order.id,
      razorpayOrderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });

    await sendOrderConfirmationIfNeeded(result.orderId).catch((emailError) => {
      console.warn('Order confirmation email warning:', emailError);
    });

    return NextResponse.json({
      success: true,
      orderId: result.orderId,
      orderNumber: result.orderNumber,
      message: result.alreadyPaid ? 'Payment already verified' : 'Payment verified and order confirmed',
    });
  } catch (error) {
    if (error instanceof PaymentFinalizationError) {
      if (error.shortfall) {
        const recovery = await recoverCapturedPayment({
          orderId: order.id,
          paymentId: razorpay_payment_id,
          signature: razorpay_signature,
          amountInPaise: expectedPaise,
          receipt: order.orderNumber,
        }).catch(() => 'REFUND_PENDING' as const);
        if (recovery !== 'REFUNDED') {
          await alertManualRefundRequired({
            paymentId: razorpay_payment_id,
            orderNumber: order.orderNumber,
            amountInPaise: expectedPaise,
            reason: 'Insufficient stock to finalize the order; automatic refund failed.',
          });
        }
        return NextResponse.json(
          {
            error:
              recovery === 'REFUNDED'
                ? 'Insufficient stock to finalize this order. The captured payment has been refunded.'
                : 'Insufficient stock to finalize this order. The payment is held for support review.',
            shortfall: error.shortfall,
          },
          { status: 409 }
        );
      }
      // Non-shortfall finalization failure on a payment we already confirmed
      // is CAPTURED — the customer paid but the order can never complete. Move
      // it to a refund-tracked state instead of leaving the money stranded.
      const recovery = await recoverCapturedPayment({
        orderId: order.id,
        paymentId: razorpay_payment_id,
        signature: razorpay_signature,
        amountInPaise: expectedPaise,
        receipt: order.orderNumber,
      }).catch(() => 'REFUND_PENDING' as const);
      console.error(
        `Order ${order.orderNumber} could not finalize a captured payment (${error.message}). Recovery: ${recovery}`
      );
      if (recovery !== 'REFUNDED') {
        await alertManualRefundRequired({
          paymentId: razorpay_payment_id,
          orderNumber: order.orderNumber,
          amountInPaise: expectedPaise,
          reason: `Finalization failed (${error.message}) and the automatic refund failed.`,
        });
      }
      return NextResponse.json(
        {
          error:
            recovery === 'REFUNDED'
              ? 'This order could not be completed after payment. The captured amount has been refunded.'
              : 'This order could not be completed after payment. Support has been notified to review it.',
        },
        { status: error.status }
      );
    }
    console.error('Razorpay verify error:', error);
    // Last-resort: a captured payment whose finalization crashed outright
    // (e.g. DB outage). Only refund if the order is still unpaid — a
    // concurrent webhook may have completed it perfectly well in the
    // meantime, and refunding a fulfilled order would be a double payout.
    const latest = await prisma.order
      .findUnique({ where: { id: order.id }, select: { paymentStatus: true } })
      .catch(() => null);
    if (!latest || latest.paymentStatus === 'PAID' || latest.paymentStatus === 'REFUNDED' || latest.paymentStatus === 'REFUND_PENDING') {
      return NextResponse.json(
        { error: 'Payment processing failed. Support has been notified to review this payment.' },
        { status: 500 }
      );
    }
    const refunded = await refundRazorpayPayment({
      paymentId: razorpay_payment_id,
      amount: expectedPaise,
      receipt: order.orderNumber,
    });
    if (!refunded) {
      console.error(`MANUAL REFUND REQUIRED for payment ${razorpay_payment_id} (order ${order.orderNumber}).`);
      await alertManualRefundRequired({
        paymentId: razorpay_payment_id,
        orderNumber: order.orderNumber,
        amountInPaise: expectedPaise,
        reason: 'Verification crashed after capture and the automatic refund failed.',
      });
    }
    return NextResponse.json(
      {
        error: refunded
          ? 'Payment processing failed. The captured amount has been refunded.'
          : 'Payment processing failed. Support has been notified to review this payment.',
      },
      { status: 500 }
    );
  }
}
