import { describe, expect, it } from 'vitest';
import {
  composeStreetAddress,
  dedupeSavedAddresses,
  normalizeAddressLabel,
  splitStreetAddress,
  type SavedCheckoutAddress,
} from '../savedAddresses';

const base: SavedCheckoutAddress = {
  id: 'a',
  fullName: 'Test Shopper',
  phone: '9876543210',
  street: 'Lotus Heights, MG Road',
  city: 'Kollam',
  state: 'Kerala',
  pincode: '691001',
};

describe('dedupeSavedAddresses', () => {
  it('keeps the first (newest) copy of the same street + PIN + phone', () => {
    const list = dedupeSavedAddresses([
      { ...base, id: 'newest' },
      { ...base, id: 'older' },
      { ...base, id: 'oldest' },
    ]);
    expect(list.map((a) => a.id)).toEqual(['newest']);
  });

  it('treats differently formatted phone numbers as the same shopper', () => {
    const list = dedupeSavedAddresses([
      { ...base, id: 'plain', phone: '9876543210' },
      { ...base, id: 'plus91', phone: '+91 98765 43210' },
    ]);
    expect(list.map((a) => a.id)).toEqual(['plain']);
  });

  it('treats case and spacing in the street as the same address', () => {
    const list = dedupeSavedAddresses([
      { ...base, id: 'one', street: 'Lotus Heights, MG Road' },
      { ...base, id: 'two', street: '  lotus heights, mg road ' },
    ]);
    expect(list.map((a) => a.id)).toEqual(['one']);
  });

  it('keeps genuinely different addresses', () => {
    const list = dedupeSavedAddresses([
      { ...base, id: 'one' },
      { ...base, id: 'other-pin', pincode: '691505' },
      { ...base, id: 'other-street', street: 'Beach Road' },
      { ...base, id: 'other-phone', phone: '9123456780' },
    ]);
    expect(list.map((a) => a.id)).toEqual(['one', 'other-pin', 'other-street', 'other-phone']);
  });

  it('drops malformed entries instead of crashing', () => {
    const list = dedupeSavedAddresses([
      { ...base, id: 'good' },
      { ...base, id: 'blank-street', street: '   ' },
      // denormalized data from an older schema
      { ...base, id: 'no-street', street: undefined as unknown as string },
    ]);
    expect(list.map((a) => a.id)).toEqual(['good']);
  });

  it('returns an empty list for an empty input', () => {
    expect(dedupeSavedAddresses([])).toEqual([]);
  });
});

describe('splitStreetAddress', () => {
  it('splits at the first comma — building first', () => {
    expect(splitStreetAddress('Puthenveedu, MG Road')).toEqual({
      building: 'Puthenveedu',
      street: 'MG Road',
    });
  });

  it('keeps multi-part streets intact after the first comma', () => {
    expect(splitStreetAddress('Ammu Nivas, Beach Road, near the temple')).toEqual({
      building: 'Ammu Nivas',
      street: 'Beach Road, near the temple',
    });
  });

  it('puts a comma-less address entirely in building', () => {
    expect(splitStreetAddress('Beach Road')).toEqual({ building: 'Beach Road', street: '' });
  });

  it('handles blanks', () => {
    expect(splitStreetAddress('   ')).toEqual({ building: '', street: '' });
  });
});

describe('composeStreetAddress', () => {
  it('joins both parts with a comma and drops blanks', () => {
    expect(composeStreetAddress('Flat 402', 'MG Road')).toBe('Flat 402, MG Road');
    expect(composeStreetAddress('Flat 402', '')).toBe('Flat 402');
    expect(composeStreetAddress('', 'MG Road')).toBe('MG Road');
  });

  it('round-trips a saved line through split + compose', () => {
    const parts = splitStreetAddress('Puthenveedu, MG Road');
    expect(composeStreetAddress(parts.building, parts.street)).toBe('Puthenveedu, MG Road');
  });
});

describe('normalizeAddressLabel', () => {
  it('accepts the three known labels case-insensitively', () => {
    expect(normalizeAddressLabel('House')).toBe('house');
    expect(normalizeAddressLabel('OFFICE')).toBe('office');
    expect(normalizeAddressLabel('other')).toBe('other');
  });

  it('rejects anything else', () => {
    expect(normalizeAddressLabel('palace')).toBeNull();
    expect(normalizeAddressLabel(null)).toBeNull();
    expect(normalizeAddressLabel(7)).toBeNull();
  });
});
