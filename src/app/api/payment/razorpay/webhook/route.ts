import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { completeRazorpayOrder, PaymentFinalizationError } from '@/lib/completeRazorpayOrder';
import { recoverCapturedPayment } from '@/lib/paymentRecovery';
import { sendOrderConfirmationIfNeeded, alertManualRefundRequired } from '@/lib/orderEmail';
import { verifyRazorpayWebhookSignature, refundRazorpayPayment } from '@/lib/razorpay';

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-razorpay-signature');

  if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
    console.error(
      'Razorpay webhook received but RAZORPAY_WEBHOOK_SECRET is not configured — every webhook 401s. ' +
        'Set it from Razorpay Dashboard → Settings → Webhooks.'
    );
  }
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
          amount?: number;
          notes?: { orderNumber?: string };
          error_description?: string;
          error_reason?: string;
        };
      };
      refund?: {
        entity?: {
          id?: string;
          payment_id?: string;
          amount?: number;
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

  if (event.event === 'refund.processed') {
    // Authoritative confirmation that a pending refund actually completed —
    // flips the order even when the synchronous API response was lost.
    const refund = event.payload?.refund?.entity;
    const refundPaymentId = refund?.payment_id;
    if (!refundPaymentId) {
      return NextResponse.json({ error: 'Incomplete refund entity' }, { status: 400 });
    }
    const updated = await prisma.order.updateMany({
      where: { paymentId: refundPaymentId, paymentStatus: 'REFUND_PENDING' },
      data: { paymentStatus: 'REFUNDED' },
    });
    console.log(
      `Razorpay refund.processed for payment ${refundPaymentId}: ${updated.count} order(s) marked REFUNDED.`
    );
    return NextResponse.json({ success: true, markedRefunded: updated.count });
  }

  if (event.event === 'payment.failed') {
    // Bookkeeping only: the order stays resumable (paymentStatus PENDING) so
    // the shopper can retry the same Razorpay order from the checkout page.
    const entity = event.payload?.payment?.entity;
    const failedOrder = entity?.order_id
      ? await prisma.order.findUnique({
          where: { razorpayOrderId: entity.order_id },
          select: { orderNumber: true, paymentStatus: true },
        })
      : null;
    console.warn(
      `Razorpay payment.failed for ${entity?.order_id ?? 'unknown order'} ` +
        `(order ${failedOrder?.orderNumber ?? 'n/a'}, local status ${failedOrder?.paymentStatus ?? 'n/a'}): ` +
        `${entity?.error_description || entity?.error_reason || 'no reason provided'}`
    );
    return NextResponse.json({ success: true, logged: true });
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
    // Money was captured but we have no order row. The create-order cleanup
    // deletes the Order when the local stock hold fails but cannot cancel the
    // provider-side Razorpay order, so a payment made in that window used to
    // be silently ignored — cash taken, nothing recorded. Refund it instead.
    console.error(
      `Captured payment ${paymentId} (${entity?.amount} paise) has no matching order for ${razorpayOrderId}; attempting automatic refund.`
    );
    const refunded = await refundRazorpayPayment({
      paymentId,
      amount: typeof entity?.amount === 'number' ? entity.amount : 0,
      receipt: entity?.notes?.orderNumber || razorpayOrderId,
    });
    if (!refunded) {
      console.error(`MANUAL REFUND REQUIRED for payment ${paymentId} (${razorpayOrderId}).`);
      await alertManualRefundRequired({
        paymentId,
        orderNumber: entity?.notes?.orderNumber || razorpayOrderId,
        amountInPaise: typeof entity?.amount === 'number' ? entity.amount : null,
        reason: 'Captured payment had no matching order and the automatic refund failed.',
      });
    }
    return NextResponse.json({ success: true, refundedUnknownPayment: refunded });
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
      // Money is captured but cannot be allocated (stock shortfall, missing
      // variant, already claimed). Mirror the verify path: move the order to
      // a refund-tracked state so it becomes visible in the studio instead of
      // stranding as an invisible AWAITING_PAYMENT row with cash taken.
      const amountInPaise =
        typeof entity?.amount === 'number'
          ? entity.amount
          : Math.round(order.totalAmount * 100);
      const recovery = await recoverCapturedPayment({
        orderId: order.id,
        paymentId,
        signature: `webhook:${paymentId}`,
        amountInPaise,
        receipt: order.orderNumber,
      }).catch(() => 'REFUND_PENDING' as const);
      if (recovery !== 'REFUNDED') {
        await alertManualRefundRequired({
          paymentId,
          orderNumber: order.orderNumber,
          amountInPaise,
          reason: `Webhook finalization failed (${error.message}) and the automatic refund is pending.`,
        });
      }
      return NextResponse.json(
        { error: error.message, shortfall: error.shortfall, recovery },
        { status: error.status }
      );
    }
    console.error('Razorpay webhook error:', error);
    // Last-resort: a captured payment whose finalization crashed outright.
    // Only recover when the order is still unpaid — a concurrent verify call
    // may have completed it in the meantime.
    const latest = await prisma.order
      .findUnique({ where: { id: order.id }, select: { paymentStatus: true } })
      .catch(() => null);
    if (
      latest &&
      latest.paymentStatus !== 'PENDING' &&
      latest.paymentStatus !== 'FAILED'
    ) {
      return NextResponse.json({ error: 'Failed to process webhook' }, { status: 500 });
    }
    const amountInPaise =
      typeof entity?.amount === 'number'
        ? entity.amount
        : Math.round(order.totalAmount * 100);
    const recovery = await recoverCapturedPayment({
      orderId: order.id,
      paymentId,
      signature: `webhook:${paymentId}`,
      amountInPaise,
      receipt: order.orderNumber,
    }).catch(() => 'REFUND_PENDING' as const);
    if (recovery !== 'REFUNDED') {
      console.error(`MANUAL REFUND REQUIRED for payment ${paymentId} (order ${order.orderNumber}).`);
      await alertManualRefundRequired({
        paymentId,
        orderNumber: order.orderNumber,
        amountInPaise,
        reason: 'Webhook processing crashed after capture and the automatic refund is pending.',
      });
    }
    return NextResponse.json({ error: 'Failed to process webhook', recovery }, { status: 500 });
  }
}
