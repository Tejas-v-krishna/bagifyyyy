import { prisma } from '@/lib/prisma';
import { refundRazorpayPayment } from '@/lib/razorpay';

/**
 * Background upkeep for order hygiene. Run from the scheduled cron endpoint
 * (/api/cron/maintenance) or manually with the same secret.
 */

/** A refund that failed its first attempt is retried once it is this old. */
const REFUND_RETRY_AFTER_MS = 10 * 60 * 1000;
/** Never-paid checkouts are deleted after this long. */
const ABANDONED_ORDER_MAX_AGE_HOURS = 24;
/** Bound per run so one invocation cannot hammer the payment provider. */
const REFUND_BATCH_SIZE = 25;
const CLEANUP_BATCH_SIZE = 200;

export type RefundRetryResult = {
  attempted: number;
  refunded: number;
  stillPending: number;
};

/**
 * Retry refunds whose first attempt failed (network blip, provider outage).
 * These orders are invisible to customers but hold real captured money, so
 * they must not depend on someone reading a log line.
 */
export async function retryPendingRefunds(): Promise<RefundRetryResult> {
  const cutoff = new Date(Date.now() - REFUND_RETRY_AFTER_MS);
  const pending = await prisma.order.findMany({
    where: {
      paymentStatus: 'REFUND_PENDING',
      paymentId: { not: null },
      updatedAt: { lte: cutoff },
    },
    select: {
      id: true,
      orderNumber: true,
      paymentId: true,
      totalAmount: true,
      refundAmountInPaise: true,
    },
    take: REFUND_BATCH_SIZE,
  });

  let refunded = 0;
  for (const order of pending) {
    const amount = order.refundAmountInPaise ?? Math.round(order.totalAmount * 100);
    const ok = await refundRazorpayPayment({
      paymentId: order.paymentId as string,
      amount,
      receipt: order.orderNumber,
    });
    if (!ok) continue;

    // Conditional update: a concurrent verify/webhook may have settled it
    // already, in which case leave their state alone.
    const updated = await prisma.order.updateMany({
      where: { id: order.id, paymentStatus: 'REFUND_PENDING' },
      data: { paymentStatus: 'REFUNDED' },
    });
    if (updated.count === 1) refunded += 1;
    console.log(`Refund retry succeeded for order ${order.orderNumber} (${amount} paise).`);
  }

  return {
    attempted: pending.length,
    refunded,
    stillPending: pending.length - refunded,
  };
}

export type AbandonedCleanupResult = {
  deleted: number;
};

/**
 * Delete never-paid checkouts and their per-checkout address rows. A payment
 * captured after deletion is still caught: the webhook's unknown-order branch
 * refunds it automatically.
 */
export async function cleanupAbandonedOrders(
  maxAgeHours = ABANDONED_ORDER_MAX_AGE_HOURS
): Promise<AbandonedCleanupResult> {
  const cutoff = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);
  const abandoned = await prisma.order.findMany({
    where: { paymentStatus: 'PENDING', createdAt: { lte: cutoff } },
    select: { id: true, shippingAddressId: true },
    take: CLEANUP_BATCH_SIZE,
  });

  if (abandoned.length === 0) return { deleted: 0 };

  const orderIds = abandoned.map((order) => order.id);
  const addressIds = [...new Set(abandoned.map((order) => order.shippingAddressId))];

  await prisma.$transaction(async (tx) => {
    // Delete children explicitly rather than relying on DB cascades — the
    // remote schema's FK state varies, and stale children would linger.
    await tx.stockReservation.deleteMany({ where: { orderId: { in: orderIds } } });
    await tx.orderItem.deleteMany({ where: { orderId: { in: orderIds } } });
    const deleted = await tx.order.deleteMany({
      where: { id: { in: orderIds }, paymentStatus: 'PENDING' },
    });
    // Addresses are created per checkout; only remove ones no other order uses.
    await tx.address.deleteMany({
      where: { id: { in: addressIds }, orders: { none: {} } },
    });
    return deleted.count;
  });

  console.log(`Abandoned checkout cleanup removed ${orderIds.length} orders.`);
  return { deleted: orderIds.length };
}
