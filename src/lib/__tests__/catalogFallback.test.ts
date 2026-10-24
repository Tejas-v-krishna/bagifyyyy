import { describe, expect, it } from 'vitest';
import {
  FALLBACK_CATALOG_CAPTURED_AT,
  findFallbackProduct,
  getFallbackHomeRails,
  queryFallbackProducts,
} from '../catalogFallback';

describe('catalogFallback', () => {
  it('serves snapshot pieces flagged as fallback with images', () => {
    const products = queryFallbackProducts({});
    expect(products.length).toBeGreaterThan(0);

    for (const product of products) {
      expect(product.fallback).toBe(true);
      expect(product.images.length).toBeGreaterThan(0);
      expect(product.image).toBe(product.images[0]);
      // No variant data in the snapshot: the archive UI must not offer sizes.
      expect(product.sizes).toEqual([]);
      expect(product.colors).toEqual([]);
    }

    expect(Number.isNaN(new Date(FALLBACK_CATALOG_CAPTURED_AT).getTime())).toBe(false);
  });

  it('filters by category, ignoring the plural/singular difference', () => {
    const all = queryFallbackProducts({});
    const category = all[0].category;

    const singular = queryFallbackProducts({ category });
    const plural = queryFallbackProducts({ category: `${category}s` });

    expect(singular.length).toBeGreaterThan(0);
    expect(plural.map((p) => p.id)).toEqual(singular.map((p) => p.id));
    expect(singular.every((p) => p.category === category)).toBe(true);
  });

  it('never widens a search that has no matches', () => {
    expect(queryFallbackProducts({ q: 'zzz-no-such-piece-zzz' })).toEqual([]);
    expect(queryFallbackProducts({ ids: ['missing-id'] })).toEqual([]);
  });

  it('resolves the 8-hex short id used by storefront links', () => {
    const [first] = queryFallbackProducts({});
    const shortId = first.id.slice(0, 8);

    const product = findFallbackProduct(shortId);
    expect(product?.id).toBe(first.id);
    expect(product?.variants).toEqual([]);
    expect(product?.fallback).toBe(true);

    expect(findFallbackProduct('00000000')).toBeNull();
  });

  it('builds homepage rails from the snapshot', () => {
    const { newArrivals, vintageArchive } = getFallbackHomeRails();

    expect(newArrivals.length).toBeGreaterThan(0);
    expect(vintageArchive.length).toBeGreaterThan(0);
    expect(newArrivals.every((row) => row.fallback === true)).toBe(true);
    expect(newArrivals.every((row) => row.images.length > 0)).toBe(true);
  });
});
