import { describe, expect, it } from 'vitest';
import { isValidCheckoutId } from '../checkout';

describe('isValidCheckoutId', () => {
  it('accepts well-formed opaque ids', () => {
    expect(isValidCheckoutId('AbC123_-x9'.padEnd(16, '0'))).toBe(true);
    expect(isValidCheckoutId('a'.repeat(100))).toBe(true);
  });

  it('rejects malformed or hostile values', () => {
    expect(isValidCheckoutId(undefined)).toBe(false);
    expect(isValidCheckoutId(42)).toBe(false);
    expect(isValidCheckoutId('short')).toBe(false); // < 16 chars
    expect(isValidCheckoutId('a'.repeat(101))).toBe(false); // > 100 chars
    expect(isValidCheckoutId('has spaces here 12345')).toBe(false);
    expect(isValidCheckoutId("'; DROP TABLE orders;--12345")).toBe(false);
    expect(isValidCheckoutId('../../etc/passwd1234')).toBe(false);
    expect(isValidCheckoutId('null')).toBe(false);
  });
});
