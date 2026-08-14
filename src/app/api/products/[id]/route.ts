import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        images: true,
        variants: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Transform to match frontend shape
    const colors = Array.from(new Set(product.variants.map(v => v.color)));
    const sizes = Array.from(new Set(product.variants.map(v => v.size)));

    const formattedProduct = {
      id: product.id,
      name: product.name,
      price: product.price,
      brand: product.brand,
      description: product.description,
      category: product.category,
      isNew: product.isNew,
      isSoldOut: product.isSoldOut,
      isBestSeller: product.isBestSeller,
      image: product.images[0]?.url || '/mock-1.jpg',
      images: product.images.map(img => img.url),
      colors,
      sizes,
    };

    // Fetch related products (same category, exclude current)
    const relatedProductsRaw = await prisma.product.findMany({
      where: {
        category: product.category,
        id: { not: product.id }
      },
      take: 4,
      include: {
        images: true,
      }
    });

    const relatedProducts = relatedProductsRaw.map(rp => ({
        id: rp.id,
        name: rp.name,
        price: rp.price,
        image: rp.images[0]?.url || '/placeholder.jpg',
        category: rp.category
    }));

    return NextResponse.json({ ...formattedProduct, relatedProducts });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}
