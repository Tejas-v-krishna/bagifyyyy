import { prisma } from '@/lib/prisma';
import { refundRazorpayPayment } from '@/lib/razorpay';

/**
 * Put a captured payment into a durable recovery state before attempting a
 * refund. A duplicate webhook/callback will see REFUND_PENDING and will not
 * submit a second refund request.
 */
export async function recoverCapturedPayment(input: {
  orderId: string;
  paymentId: string;
  signature: string;
  amountInPaise: number;
  receipt: string;
}): Promise<'REFUNDED' | 'REFUND_PENDING' | 'ALREADY_HANDLED'> {
  const claim = await prisma.order.updateMany({
    where: {
      id: input.orderId,
      paymentStatus: 'PENDING',
    },
    data: {
      paymentStatus: 'REFUND_PENDING',
      paymentId: input.paymentId,
      signature: input.signature,
      orderStatus: 'CANCELLED',
    },
  });

  if (claim.count !== 1) {
    const current = await prisma.order.findUnique({
      where: { id: input.orderId },
      select: { paymentStatus: true },
    });
    return current?.paymentStatus === 'REFUNDED'
      ? 'REFUNDED'
      : current?.paymentStatus === 'REFUND_PENDING'
        ? 'REFUND_PENDING'
        : 'ALREADY_HANDLED';
  }

  const refunded = await refundRazorpayPayment({
    paymentId: input.paymentId,
    amount: input.amountInPaise,
    receipt: input.receipt,
  });

  if (refunded) {
    await prisma.order.updateMany({
      where: { id: input.orderId, paymentStatus: 'REFUND_PENDING' },
      data: { paymentStatus: 'REFUNDED' },
    });
    return 'REFUNDED';
  }

  return 'REFUND_PENDING';
}
