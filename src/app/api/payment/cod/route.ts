import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { sendOrderConfirmationEmail } from '@/lib/email';

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

    // Calculate shipping (COD + Express or Standard)
    const shippingFee = shippingMethod === 'express' ? 99 : (subtotal >= 2000 ? 0 : 49);
    const codHandlingFee = 49; // Standard COD verification fee
    const discountAmount = Math.round(subtotal * promoDiscount * 100) / 100;
    const totalAmount = subtotal - discountAmount + shippingFee + codHandlingFee;

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

    // 4. Create Order record in DB (COD)
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId,
        customerEmail,
        customerPhone,
        totalAmount,
        shippingAmount: shippingFee + codHandlingFee,
        discountAmount,
        paymentStatus: 'PENDING',
        orderStatus: 'PROCESSING',
        paymentMethod: 'COD',
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
    });

    // 5. Decrement Inventory
    for (const item of validatedItems) {
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

    // 6. Send Transactional Order Confirmation Email
    try {
      const fullOrder = await prisma.order.findUnique({
        where: { id: order.id },
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
      amount: totalAmount,
    });
  } catch (error: any) {
    console.error('Error creating COD order:', error);
    return NextResponse.json({ error: error.message || 'Failed to place COD order' }, { status: 500 });
  }
}
