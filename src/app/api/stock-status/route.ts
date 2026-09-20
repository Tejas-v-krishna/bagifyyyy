import { NextResponse } from 'next/server';
import { getProductReservationStatus } from '@/lib/stockReservation';
import { readHoldSession } from '@/lib/checkout';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get('productId');
  // Hold identity comes from the server-minted cookie, not a caller header.
  const sessionId = readHoldSession(request) || undefined;

  if (!productId) {
    return NextResponse.json({ error: 'Missing productId' }, { status: 400 });
  }

  const status = await getProductReservationStatus(productId, sessionId);

  return NextResponse.json({
    success: true,
    productId,
    ...status,
  });
}
