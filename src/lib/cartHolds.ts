const HOLD_SESSION_KEY = 'bagify_hold_session';
const SESSION_PATTERN = /^[A-Za-z0-9_-]{16,100}$/;

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

/**
 * Stable per-browser identity used for stock holds. Shared by the bag holds
 * and checkout, so a shopper never blocks their own reservation.
 */
export function getHoldSessionId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    let id = window.localStorage.getItem(HOLD_SESSION_KEY);
    if (!id || !SESSION_PATTERN.test(id)) {
      id = (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`)
        .replace(/[^A-Za-z0-9_-]/g, '');
      window.localStorage.setItem(HOLD_SESSION_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

// Serialize syncs: every request replaces this session's holds, so letting two
// run concurrently could interleave their delete/create steps.
let queue: Promise<CartHoldResult[]> = Promise.resolve([]);

export function syncCartHolds(items: HoldableItem[]): Promise<CartHoldResult[]> {
  const run = async (): Promise<CartHoldResult[]> => {
    const sessionId = getHoldSessionId();
    if (!sessionId) return [];
    try {
      const res = await fetch('/api/cart-hold', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hold-session': sessionId,
        },
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
