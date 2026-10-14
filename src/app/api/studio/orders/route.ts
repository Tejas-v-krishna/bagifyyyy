import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isStudioAuthed } from '@/lib/requireStudioAuth';
import { AWAITING_PAYMENT, FULFILMENT_STATUSES } from '@/lib/orderStatus';
import {
  assertValidShippingAddress,
  MAX_ITEMS_PER_ORDER,
  MAX_QUANTITY_PER_ITEM,
} from '@/lib/cart';

/** Offline orders taken by the studio (Instagram DM + UPI). */
const MANUAL_PAYMENT_METHOD = 'MANUAL';
const MANUAL_ORDER_PREFIX = 'IG-';

export async function GET(request: Request) {
  if (!(await isStudioAuthed())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const take = Math.min(200, Math.max(1, parseInt(searchParams.get('take') || '100', 10) || 100));
    const skip = Math.max(0, parseInt(searchParams.get('skip') || '0', 10) || 0);

    const orders = await prisma.order.findMany({
      where: { NOT: { orderStatus: AWAITING_PAYMENT } },
      take,
      skip,
      include: {
        items: true,
        shippingAddress: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Studio orders fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

type ManualLine = {
  productId: string;
  variantId: string | null;
  sku: string | null;
  name: string;
  price: number;
  size: string;
  color: string;
  quantity: number;
  image: string;
};

function manualError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function sanitizeHandle(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/^@/, '').toLowerCase().slice(0, 30);
}

// POST /api/studio/orders — record an offline order (Instagram DM, UPI paid).
// The studio is trusted to say *who* bought and *which* variant, but prices,
// names and images are re-read from the database and stock is decremented
// atomically, so an offline sale can never oversell the website or invent a
// price. The order is written straight to PROCESSING (never AWAITING_PAYMENT)
// so it shows up in the studio queue, revenue and tracking immediately.
export async function POST(request: Request) {
  if (!(await isStudioAuthed())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return manualError('Invalid JSON payload.');
  }

  try {
    const rawItems = body.items;
    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      return manualError('Add at least one item to the order.');
    }
    if (rawItems.length > MAX_ITEMS_PER_ORDER) {
      return manualError(`An order cannot contain more than ${MAX_ITEMS_PER_ORDER} line items.`);
    }

    // Contact: phone is the real identifier for Instagram buyers. Email is
    // optional on the form; a placeholder keeps the required column satisfied
    // without inventing an address that could collide with a real account.
    const phone = typeof body.customerPhone === 'string' ? body.customerPhone.trim() : '';
    if (!/^[+\d][\d\s-]{7,15}$/.test(phone)) {
      return manualError('Enter a valid phone number.');
    }
    const handle = sanitizeHandle(
      (body as { instagramHandle?: unknown }).instagramHandle
    );
    if (handle && !/^[a-z0-9._]{1,30}$/.test(handle)) {
      return manualError('Enter a valid Instagram handle.');
    }
    const rawEmail = typeof body.customerEmail === 'string' ? body.customerEmail.trim().toLowerCase() : '';
    let customerEmail = rawEmail;
    if (!customerEmail) {
      const fallback = handle || phone.replace(/\D/g, '').slice(-10) || 'unknown';
      customerEmail = `ig-${fallback}@instagram.local`;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
      return manualError('Enter a valid email address.');
    }

    const address = assertValidShippingAddress(body.shippingAddress);

    const upiRef = typeof body.upiRef === 'string' ? body.upiRef.trim().slice(0, 100) : '';
    const trackingId =
      typeof body.trackingId === 'string' && body.trackingId.trim()
        ? body.trackingId.trim().slice(0, 100)
        : null;

    const orderStatus =
      typeof body.orderStatus === 'string' && body.orderStatus ? body.orderStatus : 'PROCESSING';
    if (!(FULFILMENT_STATUSES as readonly string[]).includes(orderStatus)) {
      return manualError('Invalid order status for a manual order.');
    }

    const shippingAmount =
      body.shippingAmount === undefined || body.shippingAmount === null || body.shippingAmount === ''
        ? 0
        : Number(body.shippingAmount);
    const discountAmount =
      body.discountAmount === undefined || body.discountAmount === null || body.discountAmount === ''
        ? 0
        : Number(body.discountAmount);
    if (!Number.isFinite(shippingAmount) || shippingAmount < 0) {
      return manualError('Shipping amount must be zero or more.');
    }
    if (!Number.isFinite(discountAmount) || discountAmount < 0) {
      return manualError('Discount amount must be zero or more.');
    }

    // Price every line from the database. The client only names the
    // product/size/colour/quantity — never what it costs.
    const lines: ManualLine[] = [];
    const requestedByVariant = new Map<string, number>();
    let subtotal = 0;

    for (const raw of rawItems) {
      if (!raw || typeof raw !== 'object') return manualError('Malformed order item.');
      const item = raw as Record<string, unknown>;
      const productId = typeof item.productId === 'string' ? item.productId : '';
      if (!productId) return manualError('Every line must reference a product.');

      const quantity =
        typeof item.quantity === 'number' ? item.quantity : Number(item.quantity);
      if (!Number.isInteger(quantity) || quantity < 1) {
        return manualError('Each line must have a whole quantity of at least 1.');
      }
      if (quantity > MAX_QUANTITY_PER_ITEM) {
        return manualError(`At most ${MAX_QUANTITY_PER_ITEM} of any single item per order.`);
      }

      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: { images: { orderBy: { position: 'asc' } }, variants: true },
      });
      if (!product) return manualError('One of the selected products no longer exists.', 409);
      if (product.isSoldOut) {
        return manualError(`${product.name} is marked sold out. Unmark it first to sell another piece.`, 409);
      }

      const requestedSize = typeof item.size === 'string' ? item.size.trim() : '';
      const requestedColor = typeof item.color === 'string' ? item.color.trim() : '';
      const variant =
        product.variants.length === 1 && !requestedSize && !requestedColor
          ? product.variants[0]
          : product.variants.find(
              (candidate) => candidate.size === requestedSize && candidate.color === requestedColor
            );
      if (product.variants.length > 0 && !variant) {
        return manualError(`${product.name} is not available in that size and color.`, 409);
      }

      const size = variant?.size || requestedSize || 'OS';
      const color = variant?.color || requestedColor || 'Default';

      if (variant) {
        const requestedTotal = (requestedByVariant.get(variant.id) ?? 0) + quantity;
        requestedByVariant.set(variant.id, requestedTotal);
        if (variant.stock < requestedTotal) {
          return manualError(
            variant.stock === 0
              ? `${product.name} (${variant.size} / ${variant.color}) is out of stock.`
              : `Only ${variant.stock} left of ${product.name} (${variant.size} / ${variant.color}).`,
            409
          );
        }
        // Do not steal pieces currently held in another shopper's checkout.
        const now = new Date();
        const held = await prisma.stockReservation.findMany({
          where: { variantId: variant.id, expiresAt: { gt: now } },
        });
        const heldQty = held.reduce((sum, r) => sum + r.quantity, 0);
        if (Math.max(0, variant.stock - heldQty) < requestedTotal) {
          return manualError(
            `${product.name} (${size} / ${color}) is currently held in a website checkout. Try again in a few minutes.`,
            409
          );
        }
      }

      subtotal = Math.round((subtotal + product.price * quantity) * 100) / 100;
      lines.push({
        productId: product.id,
        variantId: variant?.id ?? null,
        sku: product.sku ?? null,
        name: product.name,
        price: product.price,
        size,
        color,
        quantity,
        image: product.images?.[0]?.url || '/placeholder.jpg',
      });
    }

    if (discountAmount > subtotal) {
      return manualError('Discount cannot exceed the items subtotal.');
    }
    const totalAmount = Math.max(0, Math.round((subtotal - discountAmount + shippingAmount) * 100) / 100);
    if (totalAmount <= 0) {
      return manualError('Order total must be more than zero.');
    }

    let orderNumber = `${MANUAL_ORDER_PREFIX}${Math.floor(100000 + Math.random() * 900000)}`;
    for (let attempt = 0; attempt < 5; attempt++) {
      const exists = await prisma.order.findUnique({ where: { orderNumber } });
      if (!exists) break;
      orderNumber = `${MANUAL_ORDER_PREFIX}${Math.floor(100000 + Math.random() * 900000)}`;
    }

    const customerPhone = phone;
    const fullName = address.fullName;

    const created = await prisma.$transaction(async (tx) => {
      const savedAddress = await tx.address.create({
        data: {
          userId: null,
          fullName,
          phone: customerPhone,
          street: address.street,
          city: address.city,
          state: address.state,
          pincode: address.pincode,
          country: address.country,
        },
      });

      const order = await tx.order.create({
        data: {
          orderNumber,
          userId: null,
          customerEmail,
          customerPhone,
          totalAmount,
          shippingAmount,
          discountAmount,
          paymentStatus: 'PAID',
          orderStatus,
          paymentMethod: MANUAL_PAYMENT_METHOD,
          paymentId: upiRef || null,
          signature: `manual:${upiRef || 'noref'}`,
          trackingId,
          shippingAddressId: savedAddress.id,
          items: {
            create: lines.map((line) => ({
              productId: line.productId,
              sku: line.sku,
              name: line.name,
              price: line.price,
              size: line.size,
              color: line.color,
              quantity: line.quantity,
              image: line.image,
            })),
          },
        },
        include: { items: true, shippingAddress: true },
      });

      // Atomic claim per variant: concurrent website and studio sales cannot
      // both take the last piece. A failed claim rolls back the whole order.
      const variantTotals = new Map<string, number>();
      for (const line of lines) {
        if (!line.variantId) continue;
        variantTotals.set(line.variantId, (variantTotals.get(line.variantId) ?? 0) + line.quantity);
      }
      for (const [variantId, qty] of variantTotals) {
        const decrement = await tx.variant.updateMany({
          where: { id: variantId, stock: { gte: qty } },
          data: { stock: { decrement: qty } },
        });
        if (decrement.count !== 1) {
          throw new Error('INSUFFICIENT_STOCK');
        }
      }

      const productIds = [...new Set(lines.map((line) => line.productId))];
      for (const productId of productIds) {
        const variants = await tx.variant.findMany({ where: { productId } });
        const remaining = variants.reduce((sum, v) => sum + v.stock, 0);
        await tx.product.update({
          where: { id: productId },
          data: { isSoldOut: remaining <= 0 },
        });
      }

      return order;
    });

    try {
      const { revalidatePath } = await import('next/cache');
      revalidatePath('/', 'layout');
      revalidatePath('/products');
      revalidatePath('/studio/orders');
    } catch {
      // Best-effort cache invalidation
    }

    // Live log for the admin Sheet. Never throws.
    const { syncOrderToSheet } = await import('@/lib/googleSheets');
    await syncOrderToSheet(created.id);

    return NextResponse.json({ success: true, order: created }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'INSUFFICIENT_STOCK') {
      return manualError('Stock changed while saving. Refresh availability and try again.', 409);
    }
    const { CartError } = await import('@/lib/cart');
    if (error instanceof CartError) {
      return manualError(error.message, error.status);
    }
    console.error('Studio manual order create error:', error);
    return NextResponse.json({ error: 'Failed to create manual order' }, { status: 500 });
  }
}
