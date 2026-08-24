import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendOrderConfirmationEmail } from '@/lib/email';
import crypto from 'crypto';
import Razorpay from 'razorpay';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = body;

    if (
      typeof orderId !== 'string' ||
      typeof razorpay_order_id !== 'string' ||
      typeof razorpay_payment_id !== 'string' ||
      typeof razorpay_signature !== 'string'
    ) {
      return NextResponse.json(
        { error: 'Missing required payment verification fields (orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature)' },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // 1. Bind the receipt to THIS order.
    //
    // The signature below only proves "some payment happened on some Razorpay
    // order" — it says nothing about *which* of our orders it belongs to.
    // Without this check a genuine receipt from a cheap order could be replayed
    // against an arbitrarily expensive one, because orderId is an independent
    // client-supplied field.
    if (!order.razorpayOrderId || order.razorpayOrderId !== razorpay_order_id) {
      return NextResponse.json(
        { error: 'Payment does not belong to this order' },
        { status: 400 }
      );
    }

    // 2. Idempotency — a verified receipt must only ever be banked once.
    // Replaying it previously re-awarded loyalty points and re-decremented
    // stock on every call.
    if (order.paymentStatus === 'PAID') {
      return NextResponse.json({
        success: true,
        orderId: order.id,
        orderNumber: order.orderNumber,
        message: 'Payment already verified',
      });
    }

    if (order.paymentStatus !== 'PENDING') {
      return NextResponse.json(
        { error: 'This order is not awaiting payment' },
        { status: 409 }
      );
    }

    // 3. Signature Verification: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return NextResponse.json(
        { error: 'Razorpay secret key not configured on server' },
        { status: 500 }
      );
    }

    const generatedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    let isSignatureValid = false;
    try {
      const genBuf = Buffer.from(generatedSignature, 'utf-8');
      const sigBuf = Buffer.from(razorpay_signature, 'utf-8');
      if (genBuf.length === sigBuf.length) {
        isSignatureValid = crypto.timingSafeEqual(genBuf, sigBuf);
      }
    } catch {
      isSignatureValid = false;
    }

    if (!isSignatureValid) {
      // Only reachable now that the receipt is already proven to belong to this
      // order, so this can no longer be used to mark someone else's order FAILED.
      // The order status moves off AWAITING_PAYMENT too, so a rejected receipt
      // does not leave the row sitting in the studio as still-open.
      await prisma.order.update({
        where: { id: orderId },
        data: { paymentStatus: 'FAILED', orderStatus: 'CANCELLED' },
      });
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
    }

    // 4. Confirm with Razorpay that the money was actually captured, for the
    // amount we expect. The signature proves authenticity, not settlement.
    const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const expectedPaise = Math.round(order.totalAmount * 100);

    if (keyId) {
      try {
        const rzp = new Razorpay({ key_id: keyId, key_secret: keySecret });
        const payment = await rzp.payments.fetch(razorpay_payment_id);

        if (payment.order_id !== razorpay_order_id) {
          return NextResponse.json(
            { error: 'Payment does not belong to this order' },
            { status: 400 }
          );
        }

        if (payment.status !== 'captured') {
          return NextResponse.json(
            { error: `Payment is not captured (status: ${payment.status})` },
            { status: 400 }
          );
        }

        if (Number(payment.amount) !== expectedPaise) {
          console.error(
            `Payment amount mismatch on order ${order.orderNumber}: captured ${payment.amount} paise, expected ${expectedPaise}`
          );
          return NextResponse.json(
            { error: 'Paid amount does not match the order total' },
            { status: 400 }
          );
        }
      } catch (fetchErr) {
        console.error('Razorpay payment fetch failed:', fetchErr);
        return NextResponse.json(
          { error: 'Could not confirm payment with the payment provider' },
          { status: 502 }
        );
      }
    }

    // 5. Mark Order as PAID — conditionally, so two concurrent verifications
    // cannot both proceed to bank points and stock. This is also the moment the
    // order stops being a started-but-unpaid checkout and joins the fulfilment
    // queue as PROCESSING.
    const claimed = await prisma.order.updateMany({
      where: { id: orderId, paymentStatus: 'PENDING' },
      data: {
        paymentStatus: 'PAID',
        paymentId: razorpay_payment_id,
        signature: razorpay_signature,
        orderStatus: 'PROCESSING',
      },
    });

    if (claimed.count === 0) {
      // Another request won the race and already banked this payment.
      return NextResponse.json({
        success: true,
        orderId: order.id,
        orderNumber: order.orderNumber,
        message: 'Payment already verified',
      });
    }

    // 6. Decrement Variant Inventory Stock
    try {
      for (const item of order.items) {
        const variant = await prisma.variant.findFirst({
          where: {
            productId: item.productId,
            size: item.size,
            ...(item.color ? { color: item.color } : {}),
          },
        });

        if (variant && variant.stock > 0) {
          await prisma.variant.update({
            where: { id: variant.id },
            data: { stock: Math.max(0, variant.stock - item.quantity) },
          });
        }
      }
    } catch (stockError) {
      console.warn('Inventory decrement warning:', stockError);
    }

    // 7. Award Loyalty Chrome Points (1 pt per ₹10 spent)
    try {
      const earnedPoints = Math.floor(order.totalAmount / 10);
      if (earnedPoints > 0 && order.customerEmail) {
        let loyalty = await prisma.loyaltyAccount.findUnique({
          where: { email: order.customerEmail },
        });

        if (!loyalty) {
          loyalty = await prisma.loyaltyAccount.create({
            data: { email: order.customerEmail, points: earnedPoints },
          });
        } else {
          loyalty = await prisma.loyaltyAccount.update({
            where: { id: loyalty.id },
            data: { points: loyalty.points + earnedPoints },
          });
        }

        await prisma.pointTransaction.create({
          data: {
            loyaltyAccountId: loyalty.id,
            points: earnedPoints,
            reason: `Order #${order.orderNumber} Completed`,
          },
        });
      }
    } catch (loyaltyError) {
      console.warn('Loyalty points warning:', loyaltyError);
    }

    // 8. Send Transactional Order Confirmation Email
    try {
      const fullOrder = await prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true, shippingAddress: true },
      });
      if (fullOrder) {
        await sendOrderConfirmationEmail(fullOrder);
      }
    } catch (emailErr) {
      console.warn('Order confirmation email warning:', emailErr);
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      message: 'Payment verified and order confirmed',
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json({ error: 'Payment verification failed' }, { status: 500 });
  }
}
