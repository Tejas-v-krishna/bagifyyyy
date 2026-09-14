import { NextResponse } from 'next/server';
import { getProductReservationStatus } from '@/lib/stockReservation';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get('productId');
  const sessionId = request.headers.get('x-hold-session') || undefined;

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
