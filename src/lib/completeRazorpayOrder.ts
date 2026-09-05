import { prisma } from '@/lib/prisma';
import { applyLoyaltyEarn } from '@/lib/loyalty';

export class PaymentFinalizationError extends Error {
  constructor(
    message: string,
    public status = 409,
    public shortfall?: { name: string; requested: number; available: number }
  ) {
    super(message);
    this.name = 'PaymentFinalizationError';
  }
}

export type PaymentFinalizationResult = {
  orderId: string;
  orderNumber: string;
  alreadyPaid: boolean;
};

/**
 * Atomically claim a captured Razorpay payment, allocate inventory, release
 * the checkout hold, and award loyalty points. Browser callbacks and webhooks
 * both use this function, so either delivery path is safe to retry.
 */
export async function completeRazorpayOrder(input: {
  orderId: string;
  razorpayOrderId: string;
  paymentId: string;
  signature: string;
}): Promise<PaymentFinalizationResult> {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: input.orderId },
      include: { items: true },
    });

    if (!order) throw new PaymentFinalizationError('Order not found', 404);
    if (order.razorpayOrderId !== input.razorpayOrderId) {
      throw new PaymentFinalizationError('Payment does not belong to this order', 400);
    }

    if (order.paymentStatus === 'PAID') {
      if (order.paymentId && order.paymentId !== input.paymentId) {
        throw new PaymentFinalizationError('A different payment is already attached to this order', 409);
      }
      return {
        orderId: order.id,
        orderNumber: order.orderNumber,
        alreadyPaid: true,
      };
    }

    if (order.paymentStatus !== 'PENDING') {
      throw new PaymentFinalizationError(
        `This order cannot accept payments (status: ${order.paymentStatus})`,
        409
      );
    }

    const quantities = new Map<
      string,
      { productId: string; quantity: number; productName: string }
    >();

    for (const item of order.items) {
      const variants = await tx.variant.findMany({ where: { productId: item.productId } });

      // New orders cannot be created without inventory rows. This guard keeps
      // older malformed orders from being marked paid without stock allocation.
      if (variants.length === 0) {
        throw new PaymentFinalizationError(`${item.name} has no inventory record`, 409);
      }

      const variant = variants.find(
        (candidate) => candidate.size === item.size && candidate.color === item.color
      );
      if (!variant) {
        throw new PaymentFinalizationError(
          `${item.name} is no longer available in the selected size and color.`,
          409
        );
      }

      const existing = quantities.get(variant.id);
      quantities.set(variant.id, {
        productId: item.productId,
        quantity: (existing?.quantity ?? 0) + item.quantity,
        productName: item.name,
      });
    }

    const claim = await tx.order.updateMany({
      where: { id: input.orderId, paymentStatus: 'PENDING' },
      data: {
        paymentStatus: 'PAID',
        paymentId: input.paymentId,
        signature: input.signature,
        orderStatus: 'PROCESSING',
      },
    });

    if (claim.count !== 1) {
      const current = await tx.order.findUnique({ where: { id: input.orderId } });
      if (current?.paymentStatus === 'PAID') {
        return {
          orderId: current.id,
          orderNumber: current.orderNumber,
          alreadyPaid: true,
        };
      }
      throw new PaymentFinalizationError('This order has already been claimed', 409);
    }

    for (const [variantId, line] of quantities) {
      const decrement = await tx.variant.updateMany({
        where: { id: variantId, stock: { gte: line.quantity } },
        data: { stock: { decrement: line.quantity } },
      });

      if (decrement.count !== 1) {
        const currentVariant = await tx.variant.findUnique({ where: { id: variantId } });
        throw new PaymentFinalizationError(
          'Insufficient stock to finalize order',
          409,
          {
            name: line.productName,
            requested: line.quantity,
            available: currentVariant?.stock ?? 0,
          }
        );
      }
    }

    for (const productId of new Set([...quantities.values()].map((line) => line.productId))) {
      const variants = await tx.variant.findMany({ where: { productId } });
      const remaining = variants.reduce((sum, variant) => sum + variant.stock, 0);
      await tx.product.update({
        where: { id: productId },
        data: { isSoldOut: remaining <= 0 },
      });
    }

    await tx.stockReservation.deleteMany({ where: { orderId: input.orderId } });
    await applyLoyaltyEarn(tx, order.id, order.customerEmail, order.totalAmount);

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      alreadyPaid: false,
    };
  });
}
