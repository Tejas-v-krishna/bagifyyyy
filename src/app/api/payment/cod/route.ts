import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendOrderConfirmationEmail } from '@/lib/email';
import { getAuthedUser } from '@/lib/userSession';
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

    // 1. Get logged in user if available (signed session)
    const authedUser = await getAuthedUser();
    const userId: string | null = authedUser?.id || null;

    // Generate order number with retry on collision
    let orderNumber = `BGF-${Math.floor(100000 + Math.random() * 900000)}`;
    for (let attempt = 0; attempt < 5; attempt++) {
      const exists = await prisma.order.findUnique({ where: { orderNumber } });
      if (!exists) break;
      orderNumber = `BGF-${Math.floor(100000 + Math.random() * 900000)}`;
    }

    // Atomic order creation + inventory check & decrement
    const order = await prisma.$transaction(async (tx) => {
      // 1. Check and decrement stock first
      for (const item of cart.items) {
        const variant = await tx.variant.findFirst({
          where: {
            productId: item.productId,
            size: item.size,
            color: item.color,
          },
        });
        if (variant) {
          if (variant.stock < item.quantity) {
            throw new CartError(`Insufficient stock for ${item.name} (${item.size}/${item.color})`, 409);
          }
          await tx.variant.update({
            where: { id: variant.id },
            data: { stock: variant.stock - item.quantity },
          });
          const remaining = await tx.variant.findMany({ where: { productId: item.productId } });
          const totalRemaining = remaining.reduce((s, v) => s + (v.id === variant.id ? variant.stock - item.quantity : v.stock), 0);
          if (totalRemaining <= 0) {
            await tx.product.update({ where: { id: item.productId }, data: { isSoldOut: true } });
          }
        }
      }

      // 2. Save Address in DB
      const savedAddress = await tx.address.create({
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
      const createdOrder = await tx.order.create({
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

      return createdOrder;
    });

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
