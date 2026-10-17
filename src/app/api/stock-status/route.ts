import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getProductReservationStatus } from '@/lib/stockReservation';
import { readHoldSession } from '@/lib/checkout';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get('productId');
  // Hold identity comes from the server-minted cookie, not a caller header.
  const sessionId = readHoldSession(request) || undefined;

  // Short browser cache only: response is personalized by hold cookie (heldByYou),
  // so public edge cache would leak one shopper's hold to another.
  // private max-age=10 still cuts polling without poisoning the edge.
  const CACHE_HEADERS = {
    'Cache-Control': 'private, max-age=10, stale-while-revalidate=30',
    'Vary': 'Cookie',
  };

  if (!productId) {
    return NextResponse.json({ error: 'Missing productId' }, { status: 400 });
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        isSoldOut: true,
        isArchived: true,
        variants: { select: { stock: true } },
      },
    });

    const totalStock = product?.variants?.reduce((sum, v) => sum + v.stock, 0) ?? 0;
    const isSoldOut =
      !product ||
      product.isArchived ||
      product.isSoldOut ||
      (product.variants.length > 0 && totalStock <= 0);

    const status = await getProductReservationStatus(productId, sessionId);

    return NextResponse.json({
      success: true,
      productId,
      isSoldOut,
      isAvailable: !isSoldOut,
      totalStock,
      ...status,
    }, { headers: CACHE_HEADERS });
  } catch (error) {
    console.error('Error fetching stock status:', error);
    return NextResponse.json({
      success: true,
      productId,
      isSoldOut: false,
      isAvailable: true,
      isReserved: false,
      heldByYou: false,
      activeCount: 0,
      expiresAt: null,
    });
  }
}
