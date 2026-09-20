import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { syncCartReservations } from '@/lib/stockReservation';
import { holdSessionCookieOptions, readHoldSession, HOLD_SESSION_COOKIE } from '@/lib/checkout';

export const dynamic = 'force-dynamic';

/**
 * Sync this shopper's temporary holds to match their bag.
 * First to bag wins: a piece already held by another session comes back
 * `blocked`, and the client drops it with a notice.
 *
 * The hold identity lives in a server-minted HttpOnly cookie. The legacy
 * `x-hold-session` header is deliberately NOT adopted: letting the caller
 * pick the session id would let anyone who learns a shopper's id wipe that
 * shopper's holds. Shoppers mid-session at deploy time simply re-hold on
 * their next sync (holds expire within minutes anyway).
 */
export async function POST(request: Request) {
  try {
    const sessionId = readHoldSession(request) || randomUUID();

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

    const response = NextResponse.json({ success: true, results, expiresAt });
    response.cookies.set(HOLD_SESSION_COOKIE, sessionId, holdSessionCookieOptions());
    return response;
  } catch (error) {
    console.error('Cart hold sync failed:', error);
    return NextResponse.json({ error: 'Could not hold stock' }, { status: 500 });
  }
}
