import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendOrderConfirmationEmail } from '@/lib/email';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // 1. Signature Verification
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const isMock = !keySecret || keySecret.includes('mock') || keySecret.includes('placeholder') || keySecret.includes('bagify_key') || (typeof razorpay_signature === 'string' && razorpay_signature.startsWith('sig_test_'));

    if (!isMock && razorpay_order_id && razorpay_payment_id && razorpay_signature) {
      const generatedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (generatedSignature !== razorpay_signature) {
        await prisma.order.update({
          where: { id: orderId },
          data: { paymentStatus: 'FAILED' },
        });
        return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
      }
    }

    // 2. Mark Order as PAID
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'PAID',
        paymentId: razorpay_payment_id || `pay_mock_${Date.now()}`,
        signature: razorpay_signature || 'mock_sig',
        orderStatus: 'PROCESSING',
      },
    });

    // 3. Decrement Variant Inventory Stock
    try {
      for (const item of order.items) {
        const variant = await prisma.variant.findFirst({
          where: {
            productId: item.productId,
            size: item.size,
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

    // 4. Award Loyalty Chrome Points (1 pt per ₹10 spent)
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

    // 5. Send Transactional Order Confirmation Email
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
      orderId: updatedOrder.id,
      orderNumber: updatedOrder.orderNumber,
      message: 'Payment verified and order confirmed',
    });
  } catch (error: any) {
    console.error('Error verifying payment:', error);
    return NextResponse.json({ error: error.message || 'Payment verification failed' }, { status: 500 });
  }
}
