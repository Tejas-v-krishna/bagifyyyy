import { describe, expect, it } from 'vitest';
import { cartTotal, assertValidShippingAddress, assertValidContact, CartError } from '../cart';
import type { PricedCart } from '../cart';

const cart = (over: Partial<PricedCart>): PricedCart => ({
  items: [],
  subtotal: 3000,
  mrpTotal: 3000,
  mrpDiscount: 0,
  bundleDiscount: 0,
  bundleSavings: [],
  promoAmount: 0,
  discountAmount: 0,
  shippingFee: 80,
  promoCode: null,
  promoDiscount: 0,
  ...over,
});

describe('cartTotal', () => {
  it('adds the shipping fee and floors the whole total at zero on over-discount', () => {
    expect(cartTotal(cart({}))).toBe(3080);
    // discountAmount can never exceed the subtotal in priceCart(), so this
    // clamp is a safety net — it zeroes shipping as well, by design.
    expect(cartTotal(cart({ subtotal: 20, discountAmount: 500 }))).toBe(0);
  });

  it('rounds to paise', () => {
    expect(cartTotal(cart({ subtotal: 10.005, shippingFee: 0 }))).toBe(10.01);
  });
});

describe('assertValidShippingAddress', () => {
  it('accepts a complete address and defaults country', () => {
    const a = assertValidShippingAddress({
      fullName: ' Tejas ',
      street: '12 MG Road',
      city: '',
      state: '',
      pincode: '560001',
      country: '',
    });
    expect(a.fullName).toBe('Tejas');
    expect(a.city).toBe('City');
    expect(a.state).toBe('State');
    expect(a.country).toBe('India');
  });

  it('rejects missing required fields and bad PIN codes', () => {
    expect(() => assertValidShippingAddress(null)).toThrow(CartError);
    expect(() =>
      assertValidShippingAddress({ fullName: 'A', street: '', pincode: '560001' })
    ).toThrow(CartError);
    expect(() =>
      assertValidShippingAddress({ fullName: 'A', street: 'B', pincode: '12345' })
    ).toThrow(/PIN/);
  });
});

describe('assertValidContact', () => {
  it('normalizes the email and accepts a reasonable phone', () => {
    const c = assertValidContact('  Tejas@Example.COM ', '+91 98765 43210');
    expect(c.email).toBe('tejas@example.com');
    expect(c.phone).toBe('+91 98765 43210');
  });

  it('rejects bad emails and phones', () => {
    expect(() => assertValidContact('not-an-email', '9876543210')).toThrow(/email/i);
    expect(() => assertValidContact('a@b.co', 'abc')).toThrow(/phone/i);
    expect(() => assertValidContact('a@b.co', '')).toThrow(/required/i);
  });
});
