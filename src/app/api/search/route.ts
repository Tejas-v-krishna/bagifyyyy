import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim() ?? '';

  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    // SQLite is case-insensitive for TEXT but Prisma's contains is case-sensitive on some providers.
    // Use lowercase comparison by also searching lowercased q? For now use mode insensitive via raw query fallback.
    // Prisma on sqlite doesn't support mode, so we do OR with both cases by using contains with default collation.
    // We'll normalize to lower and use contains - sqlite LIKE is case-insensitive for ASCII.
    const products = await prisma.product.findMany({
      where: {
        isSoldOut: false,
        OR: [
          { name: { contains: q, mode: 'insensitive' } as any },
          { brand: { contains: q, mode: 'insensitive' } as any },
          { category: { contains: q, mode: 'insensitive' } as any },
          { description: { contains: q, mode: 'insensitive' } as any },
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
