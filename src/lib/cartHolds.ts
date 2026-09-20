/**
 * Stock-hold identity is a server-minted HttpOnly cookie (see
 * src/app/api/cart-hold/route.ts and src/lib/checkout.ts). The client never
 * picks or sends the session id — it just calls these endpoints and the
 * cookie rides along automatically. That keeps one shopper from spoofing or
 * wiping another shopper's holds.
 */

export type CartHoldStatus = 'held' | 'blocked' | 'unavailable';

export type CartHoldResult = {
  productId: string;
  status: CartHoldStatus;
};

export type HoldableItem = {
  id: string;
  size?: string;
  color?: string;
  quantity: number;
};

// Serialize syncs: every request replaces this session's holds, so letting two
// run concurrently could interleave their delete/create steps.
let queue: Promise<CartHoldResult[]> = Promise.resolve([]);

export function syncCartHolds(items: HoldableItem[]): Promise<CartHoldResult[]> {
  const run = async (): Promise<CartHoldResult[]> => {
    if (typeof window === 'undefined') return [];
    try {
      const res = await fetch('/api/cart-hold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          items: items.map((item) => ({
            id: item.id,
            size: item.size,
            color: item.color,
            quantity: item.quantity,
          })),
        }),
      });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data.results) ? data.results : [];
    } catch {
      return [];
    }
  };

  const next = queue.then(run, run);
  queue = next.catch(() => []);
  return next;
}
