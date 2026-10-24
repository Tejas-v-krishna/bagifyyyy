import { NextResponse } from 'next/server';
import { getProductForDisplay } from '@/lib/product';

/**
 * Single-product JSON.
 *
 * This route is NOT a one-off call: the "recently viewed" strip asks for up to
 * five pieces on every product page, so an uncached response meant 5 x 3
 * queries against Turso per page view — the largest read amplifier on the site.
 * A shared cache collapses that to roughly one origin hit per product per
 * five minutes.
 *
 * Staleness is safe: the buy button re-reads live stock through
 * `/api/stock-status` and checkout re-validates server-side, so a cached
 * payload can never oversell a piece.
 */
const PRODUCT_CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=900',
};

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Shared with the server-rendered product page, so the JSON-LD on that
    // page and the JSON handed to the client always describe the same row.
    const product = await getProductForDisplay(id);

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(product, { headers: PRODUCT_CACHE_HEADERS });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}
