import { describe, expect, it } from 'vitest';
import { toRazorpayContact } from '../razorpayContact';

describe('toRazorpayContact', () => {
  it('prefixes bare 10-digit Indian numbers with +91', () => {
    expect(toRazorpayContact('9876543210')).toBe('+919876543210');
  });

  it('normalises the older +91/space/leading-zero shapes saved addresses may hold', () => {
    expect(toRazorpayContact('+91 98765 43210')).toBe('+919876543210');
    expect(toRazorpayContact('091 98765 43210')).toBe('+919876543210');
    expect(toRazorpayContact('09876543210')).toBe('+919876543210');
    expect(toRazorpayContact('919876543210')).toBe('+919876543210');
  });

  it('keeps non-Indian country codes intact', () => {
    expect(toRazorpayContact('+1 415 555 2671')).toBe('+14155552671');
  });

  it('returns an empty string for empty or junk input', () => {
    expect(toRazorpayContact('')).toBe('');
    expect(toRazorpayContact('   ')).toBe('');
    expect(toRazorpayContact(null)).toBe('');
    expect(toRazorpayContact(undefined)).toBe('');
    expect(toRazorpayContact('no digits here')).toBe('');
  });
});
