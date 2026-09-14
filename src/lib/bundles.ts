import { prisma } from '@/lib/prisma';

export type BundleProduct = {
  id: string;
  name: string;
  price: number;
  image: string;
  isSoldOut: boolean;
  defaultVariant: { size: string; color: string } | null;
};

export type Bundle = {
  id: string;
  name: string;
  description: string | null;
  discount: number;
  products: BundleProduct[];
  originalTotal: number;
  bundlePrice: number;
};

/**
 * Shared bundle query used by both the /api/bundles route and the /bundles
 * server page. Never throws: a DB hiccup degrades to an empty list.
 */
export async function queryBundles(): Promise<Bundle[]> {
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

    return bundles.map((bundle) => {
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
  } catch (error) {
    console.error('Bundles fetch error:', error);
    return [];
  }
}
