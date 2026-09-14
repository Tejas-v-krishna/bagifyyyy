import { NextResponse } from 'next/server';
import { syncCartReservations } from '@/lib/stockReservation';

export const dynamic = 'force-dynamic';

const SESSION_PATTERN = /^[A-Za-z0-9_-]{16,100}$/;

/**
 * Sync this shopper's temporary holds to match their bag.
 * First to bag wins: a piece already held by another session comes back
 * `blocked`, and the client drops it with a notice.
 */
export async function POST(request: Request) {
  try {
    const sessionId = request.headers.get('x-hold-session') || '';
    if (!SESSION_PATTERN.test(sessionId)) {
      return NextResponse.json({ error: 'Missing hold session' }, { status: 400 });
    }

    const body = await request.json();
    const rawItems = Array.isArray(body?.items) ? body.items : [];

    const items = rawItems
      .slice(0, 50)
      .map((raw: Record<string, unknown>) => ({
        productId: typeof raw?.id === 'string' ? raw.id : '',
        size: typeof raw?.size === 'string' ? raw.size : '',
        color: typeof raw?.color === 'string' ? raw.color : '',
        quantity: Math.max(1, Math.min(10, Math.round(Number(raw?.quantity) || 1))),
      }))
      .filter((item: { productId: string }) => item.productId);

    const { results, expiresAt } = await syncCartReservations({ sessionId, items });

    return NextResponse.json({ success: true, results, expiresAt });
  } catch (error) {
    console.error('Cart hold sync failed:', error);
    return NextResponse.json({ error: 'Could not hold stock' }, { status: 500 });
  }
}
