import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category')?.toLowerCase().trim();
    const filter = searchParams.get('filter')?.toLowerCase().trim();

    let whereClause: any = {};

    if (category && category !== 'all') {
      const normalizedCategories = Array.from(
        new Set([
          category,
          category.replace(/s$/, ''),
          category.endsWith('s') ? category : `${category}s`,
        ])
      );
      whereClause.category = {
        in: normalizedCategories,
      };
    }

    if (filter === 'new' || filter === 'new-arrivals') {
      whereClause.isNew = true;
    } else if (filter === 'grails' || filter === 'curated' || filter === 'curated-grails') {
      whereClause.isBestSeller = true;
    }

    let products = await prisma.product.findMany({
      where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
      orderBy: filter === 'grails' || filter === 'curated' ? { price: 'desc' } : { createdAt: 'desc' },
      include: {
        images: true,
        variants: true,
      },
    });

    // Fallback if specific boolean flag has 0 items in test DB
    if (products.length === 0 && (filter === 'new' || filter === 'new-arrivals' || filter === 'grails' || filter === 'curated')) {
      products = await prisma.product.findMany({
        orderBy: filter === 'grails' || filter === 'curated' ? { price: 'desc' } : { createdAt: 'desc' },
        take: 30,
        include: {
          images: true,
          variants: true,
        },
      });
    }

    // Transform to match the frontend shape
    const formattedProducts = products.map((product) => {
      const colors = Array.from(new Set(product.variants.map((v) => v.color)));
      const sizes = Array.from(new Set(product.variants.map((v) => v.size)));

      return {
        id: product.id,
        name: product.name,
        price: product.price,
        brand: product.brand,
        description: product.description,
        category: product.category,
        isNew: product.isNew,
        isSoldOut: product.isSoldOut,
        isBestSeller: product.isBestSeller,
        image: product.images[0]?.url || '/placeholder.jpg',
        images: product.images.map((img) => img.url),
        colors,
        sizes,
      };
    });

    return NextResponse.json(formattedProducts);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
