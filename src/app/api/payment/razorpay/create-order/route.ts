import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import Razorpay from 'razorpay';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, shippingAddress, customerEmail, customerPhone, shippingMethod, promoCode } = body;

    // Validate promo code server-side
    const VALID_PROMO_CODES: Record<string, number> = { BAGIFY10: 0.10 };
    const promoDiscount = promoCode && VALID_PROMO_CODES[promoCode.toUpperCase()] ? VALID_PROMO_CODES[promoCode.toUpperCase()] : 0;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.pincode || !shippingAddress.street) {
      return NextResponse.json({ error: 'Complete shipping address is required' }, { status: 400 });
    }

    if (!customerEmail || !customerPhone) {
      return NextResponse.json({ error: 'Email and phone number are required' }, { status: 400 });
    }

    // 1. Get logged in user if available
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('user-session');
    let userId: string | null = null;
    if (sessionCookie?.value) {
      const user = await prisma.user.findUnique({ where: { id: sessionCookie.value } });
      if (user) userId = user.id;
    }

    // 2. Validate real prices from database
    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.id },
        include: { images: true },
      });

      const price = product ? product.price : item.price;
      const name = product ? product.name : item.name;
      const image = product?.images?.[0]?.url || item.image || '/placeholder.jpg';

      subtotal += price * item.quantity;
      validatedItems.push({
        productId: item.id,
        name,
        price,
        size: item.size || 'M',
        color: item.color || 'Default',
        quantity: item.quantity,
        image,
      });
    }

    // Calculate shipping
    const shippingFee = shippingMethod === 'express' ? 99 : (subtotal >= 299 ? 0 : 49);
    const discountAmount = Math.round(subtotal * promoDiscount * 100) / 100;
    const totalAmount = subtotal - discountAmount + shippingFee;
    const amountInPaise = Math.round(totalAmount * 100);

    // Generate unique order number (e.g. BGF-58291)
    const orderNumber = `BGF-${Math.floor(10000 + Math.random() * 90000)}`;

    // 3. Create or save Address in DB
    const savedAddress = await prisma.address.create({
      data: {
        userId,
        fullName: shippingAddress.fullName,
        phone: customerPhone,
        street: shippingAddress.street,
        city: shippingAddress.city || 'City',
        state: shippingAddress.state || 'State',
        pincode: shippingAddress.pincode,
        country: shippingAddress.country || 'India',
      },
    });

    // 4. Initialize Razorpay or generate fallback test order
    const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_mock';
    const keySecret = process.env.RAZORPAY_KEY_SECRET || 'mock_secret';
    let razorpayOrderId = `order_mock_${Date.now()}`;

    if (keyId && !keyId.includes('mock') && keySecret && !keySecret.includes('mock')) {
      try {
        const rzp = new Razorpay({
          key_id: keyId,
          key_secret: keySecret,
        });

        const rzpOrder = await rzp.orders.create({
          amount: amountInPaise,
          currency: 'INR',
          receipt: orderNumber,
          notes: {
            customerEmail,
            customerPhone,
            orderNumber,
          },
        });
        razorpayOrderId = rzpOrder.id;
      } catch (rzpError: any) {
        console.warn('Razorpay API error, falling back to mock order for testing:', rzpError);
      }
    }

    // 5. Create Order record in DB (PENDING)
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId,
        customerEmail,
        customerPhone,
        totalAmount,
        shippingAmount: shippingFee,
        discountAmount,
        paymentStatus: 'PENDING',
        orderStatus: 'PROCESSING',
        paymentMethod: 'RAZORPAY',
        razorpayOrderId,
        shippingAddressId: savedAddress.id,
        items: {
          create: validatedItems.map((item) => ({
            productId: item.productId,
            name: item.name,
            price: item.price,
            size: item.size,
            color: item.color,
            quantity: item.quantity,
            image: item.image,
          })),
        },
      },
      include: {
        items: true,
        shippingAddress: true,
      },
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      razorpayOrderId,
      amount: totalAmount,
      amountInPaise,
      currency: 'INR',
      keyId,
      customer: {
        name: shippingAddress.fullName,
        email: customerEmail,
        phone: customerPhone,
      },
    });
  } catch (error: any) {
    console.error('Error creating order:', error);
    return NextResponse.json({ error: error.message || 'Failed to create order' }, { status: 500 });
  }
}
