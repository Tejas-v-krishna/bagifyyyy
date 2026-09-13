import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export type CatalogProduct = {
  id: string;
  name: string;
  price: number;
  compareAtPrice: number | null;
  brand?: string;
  description?: string;
  category: string;
  isNew: boolean;
  isSoldOut: boolean;
  isBestSeller: boolean;
  image: string;
  images: string[];
  colors: string[];
  sizes: string[];
};

/**
 * Shared catalogue query used by both the /api/products route and server
 * components. Never throws: a DB hiccup degrades to an empty list instead of
 * hanging or failing the whole page.
 */
export async function queryProducts({
  category,
  filter,
  q,
  ids,
  take = 100,
}: {
  category?: string;
  filter?: string;
  q?: string;
  ids?: string[];
  take?: number;
} = {}): Promise<CatalogProduct[]> {
  try {
    const whereClause: Prisma.ProductWhereInput = {};

    if (ids && ids.length > 0) {
      whereClause.id = { in: ids };
    }

    // Only apply text search if not already filtering by ids
    if (q && q.length >= 2 && !(ids && ids.length > 0)) {
      whereClause.OR = [
        { name: { contains: q } },
        { brand: { contains: q } },
        { category: { contains: q } },
        { description: { contains: q } },
      ];
    }

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
      take,
      include: {
        images: true,
        variants: true,
      },
    });

    // Fallback if specific boolean flag has 0 items in test DB. Never applies to
    // a search: "no results for X" must stay empty rather than show everything.
    if (!q && products.length === 0 && (filter === 'new' || filter === 'new-arrivals' || filter === 'grails' || filter === 'curated')) {
      products = await prisma.product.findMany({
        orderBy: filter === 'grails' || filter === 'curated' ? { price: 'desc' } : { createdAt: 'desc' },
        take: 30,
        include: {
          images: true,
          variants: true,
        },
      });
    }

    return products.map((product) => {
      const colors = Array.from(new Set(product.variants.map((v) => v.color)));
      const sizes = Array.from(new Set(product.variants.map((v) => v.size)));
      const hasStock = product.variants.some((variant) => variant.stock > 0);

      return {
        id: product.id,
        name: product.name,
        price: product.price,
        compareAtPrice: product.compareAtPrice ?? null,
        brand: product.brand ?? undefined,
        description: product.description ?? undefined,
        category: product.category,
        isNew: product.isNew,
        isSoldOut: product.isSoldOut || product.variants.length === 0 || !hasStock,
        isBestSeller: product.isBestSeller,
        image: product.images[0]?.url || '/placeholder.jpg',
        images: product.images.map((img) => img.url),
        colors,
        sizes,
      };
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}
