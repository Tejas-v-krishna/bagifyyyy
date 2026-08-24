import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { sendOrderConfirmationEmail } from '@/lib/email';
import {
  priceCart,
  cartTotal,
  assertValidShippingAddress,
  assertValidContact,
  COD_HANDLING_FEE,
  CartError,
} from '@/lib/cart';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, shippingAddress, customerEmail, customerPhone, shippingMethod, promoCode } = body;

    // Every price, name and image below comes from the database — the request
    // body only says which product/size/colour/quantity.
    const address = assertValidShippingAddress(shippingAddress);
    const contact = assertValidContact(customerEmail, customerPhone);
    const cart = await priceCart({ items, shippingMethod, promoCode, includeCodFee: true });
    const totalAmount = cartTotal(cart);

    if (totalAmount <= 0) {
      return NextResponse.json({ error: 'Order total must be greater than zero.' }, { status: 400 });
    }

    // 1. Get logged in user if available
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('user-session');
    let userId: string | null = null;
    if (sessionCookie?.value) {
      const user = await prisma.user.findUnique({ where: { id: sessionCookie.value } });
      if (user) userId = user.id;
    }

    const orderNumber = `BGF-${Math.floor(10000 + Math.random() * 90000)}`;

    // 2. Create or save Address in DB
    const savedAddress = await prisma.address.create({
      data: {
        userId,
        fullName: address.fullName,
        phone: contact.phone,
        street: address.street,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        country: address.country,
      },
    });

    // 3. Create Order record in DB (COD)
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId,
        customerEmail: contact.email,
        customerPhone: contact.phone,
        totalAmount,
        shippingAmount: cart.shippingFee,
        discountAmount: cart.discountAmount,
        paymentStatus: 'PENDING',
        orderStatus: 'PROCESSING',
        paymentMethod: 'COD',
        shippingAddressId: savedAddress.id,
        items: {
          create: cart.items.map((item) => ({
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

    // 4. Decrement Inventory
    for (const item of cart.items) {
      const variant = await prisma.variant.findFirst({
        where: {
          productId: item.productId,
          size: item.size,
          color: item.color,
        },
      });

      if (variant && variant.stock > 0) {
        await prisma.variant.update({
          where: { id: variant.id },
          data: { stock: Math.max(0, variant.stock - item.quantity) },
        });
      }
    }

    // 5. Send Transactional Order Confirmation Email
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
      codFee: COD_HANDLING_FEE,
    });
  } catch (error) {
    if (error instanceof CartError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Error creating COD order:', error);
    return NextResponse.json({ error: 'Failed to place COD order' }, { status: 500 });
  }
}
