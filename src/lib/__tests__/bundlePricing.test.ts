import { describe, expect, it } from 'vitest';
import { computeBundleSavings, type BundleLine } from '../bundlePricing';

const line = (over: Partial<BundleLine> & { productId: string }): BundleLine => ({
  price: 1000,
  quantity: 1,
  bundleId: 'set-1',
  bundleDiscount: 15,
  bundleSize: 2,
  bundleName: 'Street Set',
  ...over,
});

describe('computeBundleSavings', () => {
  it('gives no discount for an incomplete set', () => {
    const result = computeBundleSavings([
      line({ productId: 'a' }),
      line({ productId: 'b', bundleId: null }),
    ]);
    expect(result.total).toBe(0);
    expect(result.savings).toEqual([]);
    expect(result.incompleteBundleIds).toEqual(['set-1']);
  });

  it('discounts one complete set (min quantity wins)', () => {
    const result = computeBundleSavings([
      line({ productId: 'a', quantity: 2 }),
      line({ productId: 'b', quantity: 1 }),
    ]);
    // oneSetTotal = 1000 + 1000 = 2000; 15% off one set = 300
    expect(result.total).toBe(300);
    expect(result.savings).toEqual([
      { bundleId: 'set-1', name: 'Street Set', discount: 15, sets: 1, amount: 300 },
    ]);
    expect(result.incompleteBundleIds).toEqual([]);
  });

  it('discounts twice when the bag holds two complete sets', () => {
    const result = computeBundleSavings([
      line({ productId: 'a', quantity: 2 }),
      line({ productId: 'b', quantity: 2 }),
    ]);
    expect(result.total).toBe(600);
    expect(result.savings[0].sets).toBe(2);
  });

  it('treats a discount over 90% as 90%', () => {
    const result = computeBundleSavings([
      line({ productId: 'a', bundleDiscount: 150 }),
      line({ productId: 'b', bundleDiscount: 150 }),
    ]);
    expect(result.savings[0].discount).toBe(90);
    // 90% of a ₹2000 set = ₹1800 — the clamp protects margins, not zeros it.
    expect(result.total).toBe(1800);
  });

  it('ignores lines without a bundle or with a nonsense discount/size', () => {
    const result = computeBundleSavings([
      line({ productId: 'a', bundleId: null }),
      line({ productId: 'b', bundleDiscount: 0 }),
      line({ productId: 'c', bundleSize: 0 }),
      line({ productId: 'd', bundleDiscount: -5 }),
    ]);
    expect(result.total).toBe(0);
    expect(result.savings).toEqual([]);
  });

  it('sums multiple different bundles', () => {
    const result = computeBundleSavings([
      line({ productId: 'a' }),
      line({ productId: 'b' }),
      line({ productId: 'c', bundleId: 'set-2', bundleDiscount: 10, bundleSize: 1, price: 500 }),
    ]);
    expect(result.total).toBe(350); // 300 (set-1) + 50 (set-2)
  });
});
