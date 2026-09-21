import { prisma } from '@/lib/prisma';

export const RESERVATION_HOLD_MINUTES = 7;
export const RESERVATION_HOLD_MS = RESERVATION_HOLD_MINUTES * 60 * 1000;

/** How long a piece stays held for whoever put it in their bag. */
export const CART_HOLD_MINUTES = 5;

export type CartHoldStatus = 'held' | 'blocked' | 'unavailable';

export type CartHoldResult = {
  productId: string;
  variantId: string | null;
  status: CartHoldStatus;
};

/**
 * Sync the shopper's holds to exactly match their current bag.
 *
 * First-to-bag wins: every line is checked against other sessions' active
 * holds, and only then recorded. Lines another session already holds come
 * back as `blocked` so the client can drop them and tell the shopper.
 * Called on every bag change, and periodically to renew the 15-minute hold.
 */
export async function syncCartReservations(params: {
  sessionId: string;
  items: { productId: string; size?: string; color?: string; quantity: number }[];
  holdMinutes?: number;
}): Promise<{ results: CartHoldResult[]; expiresAt: Date | null }> {
  const { sessionId, items, holdMinutes = CART_HOLD_MINUTES } = params;
  const expiresAt = new Date(Date.now() + holdMinutes * 60 * 1000);

  try {
    return await prisma.$transaction(async (tx) => {
      const now = new Date();
      await tx.stockReservation.deleteMany({ where: { expiresAt: { lte: now } } });
      // Replace this session's holds with the current bag contents.
      await tx.stockReservation.deleteMany({ where: { sessionId } });

      const results: CartHoldResult[] = [];

      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          include: { variants: true },
        });
        if (!product) {
          results.push({ productId: item.productId, variantId: null, status: 'unavailable' });
          continue;
        }

        const requestedSize = (item.size ?? '').trim();
        const requestedColor = (item.color ?? '').trim();
        const variant =
          product.variants.length === 1 && !requestedSize && !requestedColor
            ? product.variants[0]
            : product.variants.find(
                (candidate) => candidate.size === requestedSize && candidate.color === requestedColor
              );

        if (!variant) {
          results.push({ productId: item.productId, variantId: null, status: 'unavailable' });
          continue;
        }

        const otherHolds = await tx.stockReservation.findMany({
          where: {
            variantId: variant.id,
            expiresAt: { gt: now },
            sessionId: { not: sessionId },
          },
        });
        const heldByOthers = otherHolds.reduce((sum, reservation) => sum + reservation.quantity, 0);

        if (product.isSoldOut || variant.stock - heldByOthers < item.quantity) {
          results.push({
            productId: item.productId,
            variantId: variant.id,
            status: heldByOthers > 0 ? 'blocked' : 'unavailable',
          });
          continue;
        }

        await tx.stockReservation.create({
          data: {
            variantId: variant.id,
            productId: item.productId,
            sessionId,
            quantity: item.quantity,
            expiresAt,
          },
        });
        results.push({ productId: item.productId, variantId: variant.id, status: 'held' });
      }

      return {
        results,
        expiresAt: results.some((result) => result.status === 'held') ? expiresAt : null,
      };
    });
  } catch (err) {
    console.error('Failed to sync cart holds:', err);
    return { results: [], expiresAt: null };
  }
}

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
 * Check if a product currently has active unexpired holds from any collector.
 * When `sessionId` is provided, also reports whether the caller owns a hold.
 */
export async function getProductReservationStatus(productId: string, sessionId?: string): Promise<{
  isReserved: boolean;
  heldByYou: boolean;
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
      return { isReserved: false, heldByYou: false, activeCount: 0, expiresAt: null };
    }

    const totalReservedQty = active.reduce((sum, r) => sum + r.quantity, 0);
    const yours = sessionId ? active.filter((r) => r.sessionId === sessionId) : [];
    const others = sessionId ? active.filter((r) => r.sessionId !== sessionId) : active;
    // Prefer the soonest expiry among others' holds for the countdown, since
    // that is when the piece frees up again.
    const othersExpiry = others.length > 0
      ? others.reduce((soonest, r) => (r.expiresAt < soonest ? r.expiresAt : soonest), others[0].expiresAt)
      : null;

    return {
      isReserved: totalReservedQty > 0,
      heldByYou: yours.length > 0,
      activeCount: totalReservedQty,
      expiresAt: othersExpiry ?? active[0]?.expiresAt ?? null,
    };
  } catch (err) {
    console.warn('Error fetching product reservation status:', err);
    return { isReserved: false, heldByYou: false, activeCount: 0, expiresAt: null };
  }
}
