import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim() ?? '';

  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const products = await prisma.product.findMany({
      where: {
        isSoldOut: false,
        OR: [
          { name: { contains: q } },
          { brand: { contains: q } },
          { category: { contains: q } },
          { description: { contains: q } },
        ],
      },
      include: { images: { take: 1 } },
      take: 8,
      orderBy: { createdAt: 'desc' },
    });

    const results = products.map((p) => ({
      id: p.id,
      name: p.name,
      brand: p.brand,
      category: p.category,
      price: p.price,
      image: p.images[0]?.url ?? '/placeholder.jpg',
      isSoldOut: p.isSoldOut,
    }));

    return NextResponse.json({ results });
  } catch (error: any) {
    console.error('Search error:', error);
    return NextResponse.json({ results: [] });
  }
}
