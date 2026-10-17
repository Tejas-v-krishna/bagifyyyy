import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { prisma } from '@/lib/prisma';
import { getAuthedUser } from '@/lib/userSession';
import { getRazorpayKeyId, validateRazorpayConfig } from '@/lib/razorpay';
import { toRazorpayContact } from '@/lib/razorpayContact';
import { isValidCheckoutId } from '@/lib/checkout';
import { SITE_URL } from '@/lib/seo';

/** Razorpay rejects `expire_by` set less than 15 minutes ahead. */
const LINK_VALIDITY_MINUTES = 15;

/**
 * Mint a Razorpay Payment Link for an existing, still-payable order — the
 * checkout failure dialog's "pay manually" fallback.
 *
 * The link carries the exact order total and a server-set `bagifyOrderId`
 * note, so a payment made on it is finalized by the webhook through the same
 * pipeline as a Checkout payment. Razorpay also SMSes/emails the link to the
 * customer, which lets a shopper who cannot finish in their current browser
 * pay from anywhere within the link's lifetime.
 */
export async function POST(request: Request) {
  const configError = validateRazorpayConfig();
  if (configError) {
    return NextResponse.json({ error: configError }, { status: 503 });
  }

  let body: { orderId?: unknown; checkoutId?: unknown; customerEmail?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const orderId = typeof body.orderId === 'string' ? body.orderId : '';
  if (!orderId) {
    return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { shippingAddress: true },
  });
  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  // Same ownership rules create-order applies before resuming an order: the
  // checkout reference must match, and a guest order must be claimed by the
  // same email. Without this, anyone who learned an order id could mint links
  // (and trigger payment reminders) against a stranger's order.
  const authedUser = await getAuthedUser();
  const userId: string | null = authedUser?.id || null;
  const customerEmail = typeof body.customerEmail === 'string' ? body.customerEmail : '';
  const ownerMatches = order.userId
    ? order.userId === userId
    : !userId && order.customerEmail === customerEmail;
  const checkoutId = body.checkoutId;
  if (
    order.paymentMethod !== 'RAZORPAY' ||
    !isValidCheckoutId(checkoutId) ||
    checkoutId !== order.checkoutId ||
    !ownerMatches
  ) {
    return NextResponse.json(
      { error: 'This checkout reference is no longer valid.' },
      { status: 409 }
    );
  }

  if (order.paymentStatus === 'PAID') {
    return NextResponse.json({ success: true, alreadyPaid: true, orderId: order.id });
  }
  if (order.paymentStatus !== 'PENDING') {
    return NextResponse.json({ error: 'This order can no longer be paid.' }, { status: 409 });
  }

  const amountInPaise = Math.round(order.totalAmount * 100);
  if (amountInPaise < 100) {
    return NextResponse.json(
      { error: 'Order amount is below the payment minimum.' },
      { status: 400 }
    );
  }

  const keyId = getRazorpayKeyId();
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    return NextResponse.json(
      { error: 'Razorpay credentials not configured on server' },
      { status: 500 }
    );
  }

  // `expire_by` must be at least 15 minutes ahead; the extra minute keeps
  // clock skew and network latency away from the boundary.
  const expiresAtSeconds = Math.floor(Date.now() / 1000) + LINK_VALIDITY_MINUTES * 60 + 60;

  const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

  const linkFields = {
    amount: amountInPaise,
    currency: 'INR',
    description: `Order #${order.orderNumber}`,
    customer: {
      name: order.shippingAddress?.fullName || 'BAGIFYYYY customer',
      email: order.customerEmail,
      contact: toRazorpayContact(order.customerPhone),
    },
    notify: { sms: true, email: true },
    reminder_enable: false,
    // The webhook resolves the order back from this note — it is the only
    // trustworthy link between the hosted-page payment and this order.
    notes: {
      bagifyOrderId: order.id,
      orderNumber: order.orderNumber,
    },
    callback_url: `${SITE_URL}/checkout/success?order_id=${order.id}`,
    callback_method: 'get' as const,
    expire_by: expiresAtSeconds,
  };

  let link: { id: string; short_url: string };
  try {
    link = await razorpay.paymentLink.create({ ...linkFields, reference_id: order.orderNumber });
  } catch (error) {
    const description = (error as { error?: { description?: string } })?.error?.description ?? '';
    if (!/reference/i.test(description)) {
      console.error('Razorpay payment link creation failed:', error);
      return NextResponse.json(
        { error: 'Could not create the payment link. Please try again.' },
        { status: 502 }
      );
    }
    // Reference ids are unique per account — a second link for the same order
    // (repeated click, stale tab) retries once with a unique suffix.
    try {
      link = await razorpay.paymentLink.create({
        ...linkFields,
        reference_id: `${order.orderNumber}-${Date.now().toString(36).slice(-5)}`,
      });
    } catch (retryError) {
      console.error('Razorpay payment link creation failed on retry:', retryError);
      return NextResponse.json(
        { error: 'Could not create the payment link. Please try again.' },
        { status: 502 }
      );
    }
  }

  // Keep the pieces held for as long as the link is payable — the standard
  // 7-minute checkout hold would otherwise lapse (and the pieces go back on
  // sale) while the shopper finishes on the hosted page. Never fail the link
  // over this; a lapsed hold only matters if the pieces sell out first.
  const linkExpiry = new Date(expiresAtSeconds * 1000);
  await prisma.stockReservation
    .updateMany({
      where: { orderId: order.id, expiresAt: { lt: linkExpiry } },
      data: { expiresAt: linkExpiry },
    })
    .catch((error) => console.warn('Failed to extend stock hold for payment link:', error));

  return NextResponse.json({
    success: true,
    orderId: order.id,
    orderNumber: order.orderNumber,
    shortUrl: link.short_url,
    linkId: link.id,
    expiresAt: expiresAtSeconds * 1000,
  });
}
