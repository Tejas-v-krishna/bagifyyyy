import { prisma } from '@/lib/prisma';
import { computeBundleSavings, type BundleLine, type BundleSaving } from '@/lib/bundlePricing';

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
  variantId: string | null;
  name: string;
  price: number;
  size: string;
  color: string;
  quantity: number;
  image: string;
  /** Set this line was added as part of, if any. */
  bundleId: string | null;
};

export type PricedCart = {
  items: PricedItem[];
  subtotal: number;
  /** Rupees off for complete curated sets, before any promo code. */
  bundleDiscount: number;
  bundleSavings: BundleSaving[];
  /** Rupees off from the promo code, applied after the set discount. */
  promoAmount: number;
  /** Every discount combined. This is what gets written to Order.discountAmount. */
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
  sessionId?: string;
}): Promise<PricedCart> {
  const { items, shippingMethod, promoCode, includeCodFee = false, sessionId } = options;

  if (!Array.isArray(items) || items.length === 0) {
    throw new CartError('Cart is empty');
  }
  if (items.length > MAX_ITEMS_PER_ORDER) {
    throw new CartError(`An order cannot contain more than ${MAX_ITEMS_PER_ORDER} line items.`);
  }

  const pricedItems: PricedItem[] = [];
  let subtotal = 0;
  const requestedByVariant = new Map<string, number>();

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

    const requestedSize = typeof item.size === 'string' ? item.size.trim() : '';
    const requestedColor = typeof item.color === 'string' ? item.color.trim() : '';
    // A multi-variant product must be addressed by the exact size/colour pair.
    // Falling back to the first matching dimension can silently charge one
    // variant while decrementing another. Keep the old no-option behaviour for
    // legacy products that have exactly one variant row.
    const variant =
      product.variants.length === 1 && !requestedSize && !requestedColor
        ? product.variants[0]
        : product.variants.find(
            (candidate) => candidate.size === requestedSize && candidate.color === requestedColor
          );

    if (product.variants.length > 0 && !variant) {
      throw new CartError(`${product.name} is not available in that size and color.`, 409);
    }

    const size = variant?.size || requestedSize || 'OS';
    const color = variant?.color || requestedColor || 'Default';
    if (variant) {
      const requestedTotal = (requestedByVariant.get(variant.id) ?? 0) + quantity;
      requestedByVariant.set(variant.id, requestedTotal);

      if (variant.stock < requestedTotal) {
        throw new CartError(
          variant.stock === 0
            ? `${product.name} (${variant.size} / ${variant.color}) is out of stock.`
            : `Only ${variant.stock} left of ${product.name} (${variant.size} / ${variant.color}).`,
          409
        );
      }

      // Check active unexpired reservations from OTHER sessions
      const now = new Date();
      const otherReservations = await prisma.stockReservation.findMany({
        where: {
          variantId: variant.id,
          expiresAt: { gt: now },
          ...(sessionId ? { sessionId: { not: sessionId } } : {}),
        },
      });

      const reservedQty = otherReservations.reduce((sum, r) => sum + r.quantity, 0);
      const availableStock = Math.max(0, variant.stock - reservedQty);

      if (availableStock < requestedTotal) {
        throw new CartError(
          `${product.name} (${size} / ${color}) is currently held in another checkout. Try again in a few minutes.`,
          409
        );
      }
    }

    subtotal += product.price * quantity;
    pricedItems.push({
      productId: product.id,
      variantId: variant?.id ?? null,
      name: product.name,
      price: product.price,
      size,
      color,
      quantity,
      image: product.images?.[0]?.url || '/placeholder.jpg',
      bundleId: typeof item.bundleId === 'string' && item.bundleId ? item.bundleId : null,
    });
  }

  subtotal = Math.round(subtotal * 100) / 100;

  // Curated-set discounts. The client says only *which* set a line belongs to;
  // the percentage and the set's membership are read back out of the database,
  // so a tampered request cannot invent a discount or shrink a set to qualify.
  const { total: bundleDiscount, bundleSavings } = await priceBundles(pricedItems);

  const discountableSubtotal = Math.max(0, Math.round((subtotal - bundleDiscount) * 100) / 100);

  const normalizedPromo =
    typeof promoCode === 'string' && VALID_PROMO_CODES[promoCode.toUpperCase()]
      ? promoCode.toUpperCase()
      : null;
  const promoDiscount = normalizedPromo ? VALID_PROMO_CODES[normalizedPromo] : 0;
  const promoAmount = Math.round(discountableSubtotal * promoDiscount * 100) / 100;
  const discountAmount = Math.round((bundleDiscount + promoAmount) * 100) / 100;

  // Free-shipping eligibility is judged on what the shopper actually pays for
  // goods, not on the pre-discount subtotal.
  const shippingFee =
    (shippingMethod === 'express'
      ? EXPRESS_SHIPPING_FEE
      : discountableSubtotal >= FREE_SHIPPING_THRESHOLD
        ? 0
        : STANDARD_SHIPPING_FEE) + (includeCodFee ? COD_HANDLING_FEE : 0);

  return {
    items: pricedItems,
    subtotal,
    bundleDiscount,
    bundleSavings,
    promoAmount,
    discountAmount,
    shippingFee,
    promoCode: normalizedPromo,
    promoDiscount,
  };
}

/**
 * Resolve the curated sets referenced by a bag and price them from the database.
 *
 * Every input to the discount maths comes from the `Bundle` row: the percentage
 * off, and how many distinct products make a complete set. A line claiming to
 * belong to a set it isn't actually in is dropped from the calculation rather
 * than rejected, so a stale bag degrades to normal prices instead of erroring.
 */
async function priceBundles(
  items: PricedItem[]
): Promise<{ total: number; bundleSavings: BundleSaving[] }> {
  const bundleIds = [...new Set(items.map((i) => i.bundleId).filter((id): id is string => Boolean(id)))];
  if (bundleIds.length === 0) return { total: 0, bundleSavings: [] };

  const bundles = await prisma.bundle.findMany({
    where: { id: { in: bundleIds } },
    include: { products: { select: { productId: true } } },
  });

  const byId = new Map(
    bundles.map((bundle) => [
      bundle.id,
      {
        name: bundle.name,
        discount: bundle.discount,
        memberIds: new Set(bundle.products.map((p) => p.productId)),
        size: new Set(bundle.products.map((p) => p.productId)).size,
      },
    ])
  );

  const lines: BundleLine[] = [];
  for (const item of items) {
    if (!item.bundleId) continue;
    const bundle = byId.get(item.bundleId);
    // Unknown set, or a product that isn't actually in it: no set discount.
    if (!bundle || !bundle.memberIds.has(item.productId)) continue;

    lines.push({
      productId: item.productId,
      price: item.price,
      quantity: item.quantity,
      bundleId: item.bundleId,
      bundleName: bundle.name,
      bundleDiscount: bundle.discount,
      bundleSize: bundle.size,
    });
  }

  const { total, savings } = computeBundleSavings(lines);
  return { total, bundleSavings: savings };
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
