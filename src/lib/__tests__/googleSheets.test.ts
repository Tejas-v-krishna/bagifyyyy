import { describe, expect, it } from 'vitest';
import { orderToSheetRows, SHEET_HEADER } from '../googleSheets';

const baseOrder = {
  orderNumber: 'BGF-123456',
  paymentMethod: 'RAZORPAY',
  paymentStatus: 'PAID',
  orderStatus: 'PROCESSING',
  totalAmount: 1158,
  discountAmount: 0,
  shippingAmount: 80,
  customerPhone: '+91 99999 88888',
  customerEmail: 'buyer@example.com',
  paymentId: 'pay_Test123',
  trackingId: null,
  createdAt: new Date('2026-10-13T17:27:37.893Z'),
  shippingAddress: {
    fullName: 'Test Buyer',
    phone: '+91 99999 88888',
    street: '1 Test Street',
    city: 'Kochi',
    state: 'Kerala',
    pincode: '682001',
  },
};

describe('orderToSheetRows', () => {
  it('emits one row per item with the header column count', () => {
    const rows = orderToSheetRows({
      ...baseOrder,
      items: [
        { sku: 'BGF-0007', productId: 'p1', name: 'Bootcut', price: 499, size: '32', color: 'Blue', quantity: 1, image: 'https://img/1.webp' },
        { sku: null, productId: 'p2', name: 'Tee', price: 579, size: 'M', color: 'Black', quantity: 1, image: '' },
      ],
    });
    expect(rows).toHaveLength(2);
    for (const row of rows) {
      expect(row).toHaveLength(SHEET_HEADER.length);
    }
    // Header and first data column line up.
    expect(SHEET_HEADER[0]).toBe('orderNumber');
    expect(rows[0][0]).toBe('BGF-123456');
    expect(rows[0][1]).toBe('WEBSITE');
    // Badge travelled onto the row; missing badge falls back to product id.
    expect(rows[0][SHEET_HEADER.indexOf('sku')]).toBe('BGF-0007');
    expect(rows[1][SHEET_HEADER.indexOf('sku')]).toBe('p2');
    // Line total maths.
    expect(rows[0][SHEET_HEADER.indexOf('lineTotal')]).toBe(499);
    // Image URL column present for =IMAGE() use.
    expect(rows[0][SHEET_HEADER.indexOf('imageUrl')]).toBe('https://img/1.webp');
  });

  it('marks studio offline orders as INSTAGRAM channel', () => {
    const rows = orderToSheetRows({
      ...baseOrder,
      orderNumber: 'IG-482913',
      paymentMethod: 'MANUAL',
      items: [
        { sku: 'BGF-0007', productId: 'p1', name: 'Bootcut', price: 499, size: '32', color: 'Blue', quantity: 2, image: '' },
      ],
    });
    expect(rows[0][1]).toBe('INSTAGRAM');
    expect(rows[0][SHEET_HEADER.indexOf('lineTotal')]).toBe(998);
  });
});
