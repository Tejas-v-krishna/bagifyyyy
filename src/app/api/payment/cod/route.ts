import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthedUser } from '@/lib/userSession';
import {
  priceCart,
  cartTotal,
  assertValidShippingAddress,
  assertValidContact,
  COD_HANDLING_FEE,
  CartError,
} from '@/lib/cart';
import { getCheckoutId } from '@/lib/checkout';
import { sendOrderConfirmationIfNeeded } from '@/lib/orderEmail';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, shippingAddress, customerEmail, customerPhone, shippingMethod, promoCode } = body;

    // Every price, name and image below comes from the database — the request
    // body only says which product/size/colour/quantity.
    const address = assertValidShippingAddress(shippingAddress);
    const contact = assertValidContact(customerEmail, customerPhone);

    // 1. Get logged in user if available (signed session)
    const authedUser = await getAuthedUser();
    const userId: string | null = authedUser?.id || null;
    const checkoutId = getCheckoutId(request, body);
    const sessionId = checkoutId;
    const cart = await priceCart({
      items,
      shippingMethod,
      promoCode,
      includeCodFee: true,
      sessionId,
    });
    const totalAmount = cartTotal(cart);

    if (totalAmount <= 0) {
      return NextResponse.json({ error: 'Order total must be greater than zero.' }, { status: 400 });
    }

    const existingOrder = await prisma.order.findUnique({ where: { checkoutId } });
    if (existingOrder) {
      const ownerMatches = existingOrder.userId
        ? existingOrder.userId === userId
        : !userId && existingOrder.customerEmail === contact.email;
      if (!ownerMatches || existingOrder.paymentMethod !== 'COD') {
        return NextResponse.json({ error: 'This checkout reference is no longer valid.' }, { status: 409 });
      }
      return NextResponse.json({
        success: true,
        orderId: existingOrder.id,
        orderNumber: existingOrder.orderNumber,
        amount: existingOrder.totalAmount,
        codFee: COD_HANDLING_FEE,
        alreadyPlaced: true,
      });
    }

    // Generate order number with retry on collision
    let orderNumber = `BGF-${Math.floor(100000 + Math.random() * 900000)}`;
    for (let attempt = 0; attempt < 5; attempt++) {
      const exists = await prisma.order.findUnique({ where: { orderNumber } });
      if (!exists) break;
      orderNumber = `BGF-${Math.floor(100000 + Math.random() * 900000)}`;
    }

    // Atomic order creation + inventory check & decrement
    const order = await prisma.$transaction(async (tx) => {
      // 1. Decrement stock with a conditional update. Reading stock and then
      // writing a computed value allows two simultaneous COD checkouts to sell
      // the same last unit.
      const touchedProductIds = new Set<string>();
      const now = new Date();
      for (const item of cart.items) {
        if (!item.variantId) continue;

        // COD does not create a reservation of its own, so account for active
        // Razorpay holds that belong to another checkout before taking stock.
        const activeReservations = await tx.stockReservation.findMany({
          where: {
            variantId: item.variantId,
            expiresAt: { gt: now },
            sessionId: { not: sessionId },
          },
        });
        const heldByOtherCheckouts = activeReservations.reduce(
          (sum, reservation) => sum + reservation.quantity,
          0
        );
        const currentVariant = await tx.variant.findUnique({ where: { id: item.variantId } });
        if (!currentVariant || heldByOtherCheckouts + item.quantity > currentVariant.stock) {
          throw new CartError(`Insufficient stock for ${item.name} (${item.size}/${item.color})`, 409);
        }

        const decrement = await tx.variant.updateMany({
          where: { id: item.variantId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (decrement.count !== 1) {
          throw new CartError(`Insufficient stock for ${item.name} (${item.size}/${item.color})`, 409);
        }
        touchedProductIds.add(item.productId);
      }

      for (const productId of touchedProductIds) {
        const remaining = await tx.variant.findMany({ where: { productId } });
        const totalRemaining = remaining.reduce((sum, variant) => sum + variant.stock, 0);
        await tx.product.update({
          where: { id: productId },
          data: { isSoldOut: totalRemaining <= 0 },
        });
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
          checkoutId,
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

      // If this shopper moved from a held Razorpay checkout to COD, release
      // that session's obsolete hold after COD has claimed the stock.
      await tx.stockReservation.deleteMany({ where: { sessionId } });

      return createdOrder;
    });

    // Send the receipt after the order transaction commits.
    try {
      await sendOrderConfirmationIfNeeded(order.id);
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
