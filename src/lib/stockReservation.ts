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
    variantId: string | null;
    productId: string;
    quantity: number;
  }[];
}): Promise<boolean> {
  const { sessionId, orderId, items } = params;
  const expiresAt = new Date(Date.now() + RESERVATION_HOLD_MS);

  try {
    // Reservation capacity and row creation must happen in one transaction.
    // Otherwise two checkouts can both observe the same free stock and place
    // holds that exceed the variant's inventory.
    return await prisma.$transaction(async (tx) => {
      const now = new Date();

      await tx.stockReservation.deleteMany({
        where: { expiresAt: { lte: now } },
      });
      await tx.stockReservation.deleteMany({ where: { sessionId } });

      for (const item of items) {
        // Products without variants are valid legacy/catalogue items, but there
        // is no variant row against which a temporary hold can be recorded.
        if (!item.variantId) continue;

        const variant = await tx.variant.findUnique({ where: { id: item.variantId } });
        if (!variant || variant.productId !== item.productId) {
          throw new Error(`Product ${item.productId} has no valid reservable variant.`);
        }

        const activeReservations = await tx.stockReservation.findMany({
          where: {
            variantId: item.variantId,
            expiresAt: { gt: now },
            sessionId: { not: sessionId },
          },
        });
        const heldByOthers = activeReservations.reduce((sum, reservation) => sum + reservation.quantity, 0);
        if (heldByOthers + item.quantity > variant.stock) {
          throw new Error(`Insufficient available stock for ${item.productId}.`);
        }

        await tx.stockReservation.create({
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
    });
  } catch (err) {
    console.error('Failed to reserve stock:', err);
    await prisma.stockReservation.deleteMany({
      where: { sessionId, ...(orderId ? { orderId } : {}) },
    }).catch(() => {});
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
