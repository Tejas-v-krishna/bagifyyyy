import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const bundles = await prisma.bundle.findMany({
      include: {
        products: {
          include: {
            product: {
              include: { images: { take: 1 }, variants: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = bundles.map((bundle) => {
      const items = bundle.products.map((bp) => ({
        ...(() => {
          const defaultVariant = bp.product.variants.find((variant) => variant.stock > 0) ?? bp.product.variants[0];
          return {
            defaultVariant: defaultVariant
              ? { size: defaultVariant.size, color: defaultVariant.color }
              : null,
          };
        })(),
        id: bp.product.id,
        name: bp.product.name,
        price: bp.product.price,
        image: bp.product.images[0]?.url ?? '/placeholder.jpg',
        isSoldOut:
          bp.product.isSoldOut ||
          (bp.product.variants.length > 0 && !bp.product.variants.some((variant) => variant.stock > 0)),
      }));
      const originalTotal = items.reduce((sum, p) => sum + p.price, 0);
      const bundlePrice = Math.round(originalTotal * (1 - bundle.discount / 100) * 100) / 100;
      return {
        id: bundle.id,
        name: bundle.name,
        description: bundle.description,
        discount: bundle.discount,
        products: items,
        originalTotal,
        bundlePrice,
      };
    });

    return NextResponse.json({ bundles: formatted });
  } catch (error) {
    console.error('Bundles fetch error:', error);
    return NextResponse.json({ bundles: [] });
  }
}
