import { NextResponse } from 'next/server';
import { getProductForDisplay } from '@/lib/product';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Shared with the server-rendered product page, so the JSON-LD on that
    // page and the JSON handed to the client always describe the same row.
    const product = await getProductForDisplay(id);

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}
