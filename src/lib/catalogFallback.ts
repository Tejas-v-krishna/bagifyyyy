/**
 * Offline catalogue.
 *
 * Turso can refuse *all* reads at once (free-plan row-read quota, an outage, a
 * blocked network path). When that happens every listing — and therefore every
 * product image — disappears, which reads as "the site is broken" even though
 * the storefront is fine.
 *
 * `src/data/catalog-fallback.json` is a frozen copy of the last healthy
 * catalogue (refresh with `scripts/snapshot-catalog.ts`). It is only consulted
 * when a database read *fails*; a genuinely empty store still renders empty.
 * Anything served from here is marked `fallback: true` so the UI can show an
 * archive notice and hide checkout actions — stale stock must never be sold.
 */
import snapshot from '@/data/catalog-fallback.json';
import type { CatalogProduct } from '@/lib/products';
import type { ProductForDisplay } from '@/lib/product';

type SnapshotProduct = {
  id: string;
  name: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  brand: string | null;
  category: string;
  subcategory: string | null;
  isNew: boolean;
  isBestSeller: boolean;
  isSoldOut: boolean;
  createdAt: string;
  images: string[];
};

const SNAPSHOT = snapshot as { capturedAt: string; products: SnapshotProduct[] };

/** When the catalogue copy was taken. Shown to shoppers in the archive notice. */
export const FALLBACK_CATALOG_CAPTURED_AT = SNAPSHOT.capturedAt;

const snapshotProducts = SNAPSHOT.products;

/**
 * Shape the homepage rails consume. Deliberately identical to the Prisma row
 * produced by `include: { images: true, variants: true }` so a failed query can
 * fall back to these rows without widening every downstream type.
 */
export type FallbackProductRow = {
  id: string;
  sku: string | null;
  name: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  brand: string | null;
  category: string;
  subcategory: string | null;
  isNew: boolean;
  isBestSeller: boolean;
  isSoldOut: boolean;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
  /** Marks the row as snapshot data so the UI can go read-only. */
  fallback?: boolean;
  images: { id: string; url: string; position: number; productId: string }[];
  variants: { id: string; color: string; size: string; stock: number; productId: string }[];
};

function toCatalogProduct(product: SnapshotProduct): CatalogProduct {
  return {
    id: product.id,
    name: product.name,
    price: product.price,
    compareAtPrice: product.compareAtPrice ?? null,
    brand: product.brand ?? undefined,
    description: product.description,
    category: product.category,
    subcategory: product.subcategory ?? null,
    isNew: product.isNew,
    isSoldOut: product.isSoldOut,
    isBestSeller: product.isBestSeller,
    reserved: false,
    image: product.images[0] ?? '/placeholder.jpg',
    // Sizes/colours live in the Variant table, which is not part of the
    // snapshot: archive pieces are display-only, so an empty list is honest.
    images: product.images,
    colors: [],
    sizes: [],
    fallback: true,
  };
}

/** Mirrors the category normalisation in `queryProducts`. */
function categoryMatches(productCategory: string, category: string): boolean {
  const wanted = new Set([
    category,
    category.replace(/s$/, ''),
    category.endsWith('s') ? category : `${category}s`,
  ]);
  return wanted.has(productCategory) || wanted.has(productCategory.replace(/s$/, ''));
}

export function queryFallbackProducts({
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
} = {}): CatalogProduct[] {
  let products = snapshotProducts;

  if (ids && ids.length > 0) {
    const wanted = new Set(ids);
    products = products.filter((product) => wanted.has(product.id));
  } else if (q && q.length >= 2) {
    const needle = q.toLowerCase();
    products = products.filter((product) =>
      [product.name, product.brand ?? '', product.category, product.description]
        .join(' ')
        .toLowerCase()
        .includes(needle)
    );
  }

  if (category && category !== 'all') {
    products = products.filter((product) => categoryMatches(product.category, category));
  }

  if (filter === 'new' || filter === 'new-arrivals') {
    const flagged = products.filter((product) => product.isNew);
    // Same rule as the live query: never show an empty rail when the flag is
    // simply unset, but never widen a search either.
    products = !q && flagged.length === 0 ? products : flagged;
  } else if (filter === 'grails' || filter === 'curated' || filter === 'curated-grails') {
    const flagged = products.filter((product) => product.isBestSeller);
    products = !q && flagged.length === 0 ? products : flagged;
  }

  const byPrice = filter === 'grails' || filter === 'curated' || filter === 'curated-grails';
  const sorted = [...products].sort((a, b) =>
    byPrice
      ? b.price - a.price
      : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return sorted.slice(0, take).map(toCatalogProduct);
}

function toFallbackRow(product: SnapshotProduct): FallbackProductRow {
  const createdAt = new Date(product.createdAt);
  return {
    id: product.id,
    sku: null,
    name: product.name,
    description: product.description,
    price: product.price,
    compareAtPrice: product.compareAtPrice ?? null,
    brand: product.brand,
    category: product.category,
    subcategory: product.subcategory,
    isNew: product.isNew,
    isBestSeller: product.isBestSeller,
    isSoldOut: product.isSoldOut,
    isArchived: false,
    createdAt,
    updatedAt: createdAt,
    fallback: true,
    images: product.images.map((url, index) => ({
      id: `${product.id}-${index}`,
      url,
      position: index,
      productId: product.id,
    })),
    // Variants are not part of the snapshot; empty means "no size picker" and
    // the archive UI never offers a cart action anyway.
    variants: [],
  };
}

/** Homepage rails, in the same shape the page already formats. */
export function getFallbackHomeRails(): {
  newArrivals: FallbackProductRow[];
  vintageArchive: FallbackProductRow[];
} {
  const rows = snapshotProducts.map(toFallbackRow);
  const newest = [...rows].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  const priceTop = [...rows].sort((a, b) => b.price - a.price).slice(0, 20);
  return {
    newArrivals: rows.filter((product) => product.isNew).slice(0, 20),
    vintageArchive: priceTop.length > 0 ? priceTop : newest.slice(0, 20),
  };
}

/**
 * Resolve a product page from the snapshot. Accepts a full id or the 8-hex
 * short id/slug suffix the storefront links use.
 */
export function findFallbackProduct(idOrSlug: string): ProductForDisplay | null {
  const needle = idOrSlug.trim().toLowerCase();
  if (!needle) return null;

  const hex = needle.match(/[a-f0-9]{8}$/) ?? needle.match(/^[a-f0-9]{8}/);
  const product =
    snapshotProducts.find((entry) => entry.id.toLowerCase() === needle) ??
    (hex ? snapshotProducts.find((entry) => entry.id.toLowerCase().startsWith(hex[0])) : undefined);

  if (!product) return null;

  const relatedProducts = snapshotProducts
    .filter((entry) => entry.id !== product.id && entry.category === product.category)
    .slice(0, 4)
    .map((entry) => ({
      id: entry.id,
      name: entry.name,
      price: entry.price,
      image: entry.images[0] ?? '/placeholder.jpg',
      images: entry.images,
      category: entry.category,
    }));

  return {
    id: product.id,
    name: product.name,
    price: product.price,
    compareAtPrice: product.compareAtPrice ?? null,
    brand: product.brand,
    description: product.description,
    category: product.category,
    subcategory: product.subcategory,
    isNew: product.isNew,
    isSoldOut: product.isSoldOut,
    isBestSeller: product.isBestSeller,
    isArchived: false,
    image: product.images[0] ?? '/placeholder.jpg',
    images: product.images,
    colors: [],
    sizes: [],
    variants: [],
    relatedProducts,
    totalStock: 0,
    rating: { count: 0, average: null },
    fallback: true,
  };
}
