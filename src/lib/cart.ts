import { prisma } from '@/lib/prisma';

/** Promo codes and their fractional discount. Server-side source of truth. */
export const VALID_PROMO_CODES: Record<string, number> = { BAGIFY10: 0.10 };

export const MAX_QUANTITY_PER_ITEM = 10;
export const MAX_ITEMS_PER_ORDER = 50;
export const COD_HANDLING_FEE = 49;
export const EXPRESS_SHIPPING_FEE = 99;
export const STANDARD_SHIPPING_FEE = 49;
export const FREE_SHIPPING_THRESHOLD = 2000;

export type PricedItem = {
  productId: string;
  name: string;
  price: number;
  size: string;
  color: string;
  quantity: number;
  image: string;
};

export type PricedCart = {
  items: PricedItem[];
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  promoCode: string | null;
  promoDiscount: number;
};

/** Thrown for any client-correctable problem; carries the HTTP status to use. */
export class CartError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = 'CartError';
    this.status = status;
  }
}

function asPositiveIntQuantity(value: unknown): number {
  const quantity = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new CartError('Each item must have a whole quantity of at least 1.');
  }
  if (quantity > MAX_QUANTITY_PER_ITEM) {
    throw new CartError(`You can order at most ${MAX_QUANTITY_PER_ITEM} of any single item.`);
  }
  return quantity;
}

/**
 * Resolve a client cart into server-priced line items.
 *
 * Every price, name and image comes from the database. The request body is used
 * only to say *which* product, size, colour and quantity — never what it costs.
 * A product id that does not resolve is a hard error rather than a fall back to
 * the client's own price, which previously allowed any cart to be bought for ₹1.
 */
export async function priceCart(options: {
  items: unknown;
  shippingMethod?: unknown;
  promoCode?: unknown;
  includeCodFee?: boolean;
}): Promise<PricedCart> {
  const { items, shippingMethod, promoCode, includeCodFee = false } = options;

  if (!Array.isArray(items) || items.length === 0) {
    throw new CartError('Cart is empty');
  }
  if (items.length > MAX_ITEMS_PER_ORDER) {
    throw new CartError(`An order cannot contain more than ${MAX_ITEMS_PER_ORDER} line items.`);
  }

  const pricedItems: PricedItem[] = [];
  let subtotal = 0;

  for (const raw of items) {
    if (!raw || typeof raw !== 'object') {
      throw new CartError('Malformed cart item.');
    }

    const item = raw as Record<string, unknown>;
    const productId = typeof item.id === 'string' ? item.id : '';
    if (!productId) {
      throw new CartError('Every cart item must reference a product.');
    }

    const quantity = asPositiveIntQuantity(item.quantity);

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { images: true, variants: true },
    });

    if (!product) {
      throw new CartError('One of the items in your bag is no longer available.', 409);
    }
    if (product.isSoldOut) {
      throw new CartError(`${product.name} is sold out.`, 409);
    }

    const size = typeof item.size === 'string' && item.size ? item.size : 'M';
    const color = typeof item.color === 'string' && item.color ? item.color : 'Default';

    // Only enforce stock when we actually have a variant row to check against —
    // products without variant records cannot be verified either way.
    const variant = product.variants.find((v) => v.size === size && v.color === color);
    if (variant && variant.stock < quantity) {
      throw new CartError(
        variant.stock === 0
          ? `${product.name} (${size} / ${color}) is out of stock.`
          : `Only ${variant.stock} left of ${product.name} (${size} / ${color}).`,
        409
      );
    }

    subtotal += product.price * quantity;
    pricedItems.push({
      productId: product.id,
      name: product.name,
      price: product.price,
      size,
      color,
      quantity,
      image: product.images?.[0]?.url || '/placeholder.jpg',
    });
  }

  subtotal = Math.round(subtotal * 100) / 100;

  const normalizedPromo =
    typeof promoCode === 'string' && VALID_PROMO_CODES[promoCode.toUpperCase()]
      ? promoCode.toUpperCase()
      : null;
  const promoDiscount = normalizedPromo ? VALID_PROMO_CODES[normalizedPromo] : 0;
  const discountAmount = Math.round(subtotal * promoDiscount * 100) / 100;

  const shippingFee =
    (shippingMethod === 'express'
      ? EXPRESS_SHIPPING_FEE
      : subtotal >= FREE_SHIPPING_THRESHOLD
        ? 0
        : STANDARD_SHIPPING_FEE) + (includeCodFee ? COD_HANDLING_FEE : 0);

  return {
    items: pricedItems,
    subtotal,
    discountAmount,
    shippingFee,
    promoCode: normalizedPromo,
    promoDiscount,
  };
}

/** Total actually charged, rounded to paise and never negative. */
export function cartTotal(cart: PricedCart): number {
  return Math.max(0, Math.round((cart.subtotal - cart.discountAmount + cart.shippingFee) * 100) / 100);
}

/** Basic shipping-address validation shared by every order-creating route. */
export function assertValidShippingAddress(address: unknown): {
  fullName: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
} {
  if (!address || typeof address !== 'object') {
    throw new CartError('Complete shipping address is required');
  }
  const a = address as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

  const fullName = str(a.fullName);
  const street = str(a.street);
  const pincode = str(a.pincode);

  if (!fullName || !street || !pincode) {
    throw new CartError('Complete shipping address is required');
  }
  if (!/^\d{6}$/.test(pincode)) {
    throw new CartError('Enter a valid 6-digit PIN code.');
  }

  return {
    fullName,
    street,
    city: str(a.city) || 'City',
    state: str(a.state) || 'State',
    pincode,
    country: str(a.country) || 'India',
  };
}

/** Validates the contact pair every order needs to be fulfillable. */
export function assertValidContact(email: unknown, phone: unknown): { email: string; phone: string } {
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const normalizedPhone = typeof phone === 'string' ? phone.trim() : '';

  if (!normalizedEmail || !normalizedPhone) {
    throw new CartError('Email and phone number are required');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new CartError('Enter a valid email address.');
  }
  if (!/^[+\d][\d\s-]{7,15}$/.test(normalizedPhone)) {
    throw new CartError('Enter a valid phone number.');
  }

  return { email: normalizedEmail, phone: normalizedPhone };
}
