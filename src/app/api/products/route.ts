import { NextResponse } from 'next/server';
import { queryProducts } from '@/lib/products';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category')?.toLowerCase().trim() || undefined;
    const filter = searchParams.get('filter')?.toLowerCase().trim() || undefined;
    const q = searchParams.get('q')?.trim() || undefined;

    // Handle wishlist ids fetch: ?ids=id1,id2
    const idsParam = searchParams.get('ids');
    const ids = idsParam
      ? idsParam.split(',').map(s => s.trim()).filter(Boolean).slice(0, 50)
      : undefined;

    // Pagination safeguard — prevent returning entire DB
    const take = Math.min(100, Math.max(1, parseInt(searchParams.get('take') || '100', 10) || 100));

    const formattedProducts = await queryProducts({ category, filter, q, ids, take });
    return NextResponse.json(formattedProducts);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
