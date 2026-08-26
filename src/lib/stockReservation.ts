import { prisma } from '@/lib/prisma';

export const RESERVATION_HOLD_MINUTES = 7;
export const RESERVATION_HOLD_MS = RESERVATION_HOLD_MINUTES * 60 * 1000;

/**
 * Remove stale/expired checkout reservations.
 */
export async function cleanupExpiredReservations(): Promise<number> {
  try {
    const deleted = await prisma.stockReservation.deleteMany({
      where: {
        expiresAt: { lte: new Date() },
      },
    });
    return deleted.count;
  } catch (err) {
    console.warn('Failed to cleanup expired stock reservations:', err);
    return 0;
  }
}

/**
 * Create or extend a temporary reservation hold for cart items in a checkout session.
 */
export async function reserveCartStock(params: {
  sessionId: string;
  orderId?: string;
  items: {
    variantId?: string;
    productId: string;
    quantity: number;
  }[];
}): Promise<boolean> {
  const { sessionId, orderId, items } = params;
  const expiresAt = new Date(Date.now() + RESERVATION_HOLD_MS);

  try {
    // 1. Clean up stale holds
    await cleanupExpiredReservations();

    // 2. Remove existing reservations for this session to refresh
    await prisma.stockReservation.deleteMany({
      where: { sessionId },
    });

    // 3. Create fresh reservations for each item
    for (const item of items) {
      if (!item.variantId) continue;
      await prisma.stockReservation.create({
        data: {
          variantId: item.variantId,
          productId: item.productId,
          sessionId,
          orderId: orderId || null,
          quantity: item.quantity,
          expiresAt,
        },
      });
    }

    return true;
  } catch (err) {
    console.error('Failed to reserve stock:', err);
    return false;
  }
}

/**
 * Release reservations when an order is finalized or cancelled.
 */
export async function releaseStockReservation(params: {
  sessionId?: string;
  orderId?: string;
}): Promise<void> {
  const { sessionId, orderId } = params;
  try {
    if (orderId) {
      await prisma.stockReservation.deleteMany({
        where: { orderId },
      });
    } else if (sessionId) {
      await prisma.stockReservation.deleteMany({
        where: { sessionId },
      });
    }
  } catch (err) {
    console.warn('Failed to release stock reservation:', err);
  }
}

/**
 * Check if a product currently has active unexpired checkout holds from any collector.
 */
export async function getProductReservationStatus(productId: string): Promise<{
  isReserved: boolean;
  activeCount: number;
  expiresAt: Date | null;
}> {
  try {
    await cleanupExpiredReservations();

    const now = new Date();
    const active = await prisma.stockReservation.findMany({
      where: {
        productId,
        expiresAt: { gt: now },
      },
      orderBy: { expiresAt: 'desc' },
    });

    if (active.length === 0) {
      return { isReserved: false, activeCount: 0, expiresAt: null };
    }

    const totalReservedQty = active.reduce((sum, r) => sum + r.quantity, 0);
    return {
      isReserved: totalReservedQty > 0,
      activeCount: totalReservedQty,
      expiresAt: active[0]?.expiresAt || null,
    };
  } catch (err) {
    console.warn('Error fetching product reservation status:', err);
    return { isReserved: false, activeCount: 0, expiresAt: null };
  }
}
