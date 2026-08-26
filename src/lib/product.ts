/**
 * One place that reads a product for display.
 *
 * Both the product API route and the server-rendered product page need the
 * same shape: the flattened product, its sibling products, and the numbers
 * that structured data needs (stock, rating). Keeping the shaping here means
 * the page's JSON-LD can never drift from what the API hands the client.
 */

import { prisma } from '@/lib/prisma';

export type DisplayProduct = {
  id: string;
  name: string;
  price: number;
  brand: string | null;
  description: string;
  category: string;
  isNew: boolean;
  isSoldOut: boolean;
  isBestSeller: boolean;
  /** First image, or the placeholder the storefront has always fallen back to. */
  image: string;
  images: string[];
  colors: string[];
  sizes: string[];
};

export type RelatedProduct = {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
};

export type ProductRating = {
  /** Number of reviews. Zero means "do not claim a rating anywhere". */
  count: number;
  /** Mean rating rounded to one decimal, or null when there are no reviews. */
  average: number | null;
};

export type ProductForDisplay = DisplayProduct & {
  relatedProducts: RelatedProduct[];
  /** Summed variant stock. Used for schema.org availability. */
  totalStock: number;
  rating: ProductRating;
};

/**
 * Reads one product, or null when there is no such row.
 *
 * The return value is what `/api/products/[id]` has always sent, plus
 * `totalStock` and `rating` — additive, so existing callers are unaffected.
 */
export async function getProductForDisplay(
  id: string
): Promise<ProductForDisplay | null> {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      images: true,
      variants: true,
    },
  });

  if (!product) return null;

  const colors = Array.from(new Set(product.variants.map((v) => v.color)));
  const sizes = Array.from(new Set(product.variants.map((v) => v.size)));
  const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);

  const [relatedProductsRaw, ratingGroup] = await Promise.all([
    prisma.product.findMany({
      where: {
        category: product.category,
        id: { not: product.id },
      },
      take: 4,
      include: { images: true },
    }),
    prisma.review.aggregate({
      where: { productId: id },
      _avg: { rating: true },
      _count: { rating: true },
    }),
  ]);

  const reviewCount = ratingGroup._count.rating ?? 0;
  const reviewAverage = ratingGroup._avg.rating;

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
    image: product.images[0]?.url || '/mock-1.jpg',
    images: product.images.map((img) => img.url),
    colors,
    sizes,
    relatedProducts: relatedProductsRaw.map((rp) => ({
      id: rp.id,
      name: rp.name,
      price: rp.price,
      image: rp.images[0]?.url || '/placeholder.jpg',
      category: rp.category,
    })),
    totalStock,
    rating: {
      count: reviewCount,
      // Round to one decimal. Null when unrated so nothing downstream is
      // tempted to publish a rating we do not have.
      average:
        reviewCount > 0 && reviewAverage !== null
          ? Math.round(reviewAverage * 10) / 10
          : null,
    },
  };
}
