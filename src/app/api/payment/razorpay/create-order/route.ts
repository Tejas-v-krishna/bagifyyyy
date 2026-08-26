import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import Razorpay from 'razorpay';
import {
  priceCart,
  cartTotal,
  assertValidShippingAddress,
  assertValidContact,
  CartError,
} from '@/lib/cart';
import { AWAITING_PAYMENT } from '@/lib/orderStatus';
import { reserveCartStock } from '@/lib/stockReservation';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, shippingAddress, customerEmail, customerPhone, shippingMethod, promoCode } = body;

    // 1. Get logged in user if available
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('user-session');
    let userId: string | null = null;
    if (sessionCookie?.value) {
      const user = await prisma.user.findUnique({ where: { id: sessionCookie.value } });
      if (user) userId = user.id;
    }

    // Every price, name and image below comes from the database — the request
    // body only says which product/size/colour/quantity.
    const address = assertValidShippingAddress(shippingAddress);
    const contact = assertValidContact(customerEmail, customerPhone);
    const sessionId = sessionCookie?.value || contact.email;
    const cart = await priceCart({ items, shippingMethod, promoCode, sessionId });
    const totalAmount = cartTotal(cart);
    const amountInPaise = Math.round(totalAmount * 100);

    // Generate unique order number (e.g. BGF-58291)
    const orderNumber = `BGF-${Math.floor(10000 + Math.random() * 90000)}`;

    // 2. Initialize Razorpay
    const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json(
        { error: 'Razorpay credentials not configured on server' },
        { status: 500 }
      );
    }

    if (amountInPaise < 100) {
      return NextResponse.json(
        { error: 'Minimum payable amount must be at least ₹1.00 (100 paise)' },
        { status: 400 }
      );
    }

    // 3. Create the Razorpay order first. Nothing is written to our database
    // until the payment provider has accepted the order, so a provider failure
    // no longer leaves an orphan address row behind.
    const rzp = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    let razorpayOrderId: string;
    try {
      const rzpOrder = await rzp.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: orderNumber,
        notes: {
          customerEmail: contact.email,
          customerPhone: contact.phone,
          orderNumber,
        },
      });
      razorpayOrderId = rzpOrder.id;
    } catch (rzpError) {
      const statusCode = (rzpError as { statusCode?: number })?.statusCode;
      const description = (rzpError as { error?: { description?: string } })?.error?.description;

      // Razorpay answers a mismatched key_id/key_secret pair with a 401 and the
      // description "Authentication failed". That used to be forwarded verbatim
      // to the shopper, who had no way to know it meant *our* keys were wrong.
      if (statusCode === 401 || description === 'Authentication failed') {
        console.error(
          `RAZORPAY CREDENTIALS REJECTED. key_id "${keyId}" was not accepted with the ` +
            'configured RAZORPAY_KEY_SECRET. Both values must come from the same ' +
            'Razorpay account and the same mode (test keys start rzp_test_, live keys ' +
            'rzp_live_). Check the environment of the running server, not just .env.',
          rzpError
        );
        return NextResponse.json(
          { error: 'Payments are temporarily unavailable. Please try again shortly or contact us.' },
          { status: 500 }
        );
      }

      console.error('Razorpay API order creation failed:', description ?? rzpError);
      return NextResponse.json(
        { error: 'Could not start payment with the payment provider. Please try again.' },
        { status: 502 }
      );
    }

    // 4. Persist the address now that the provider has accepted the order
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

    // 5. Create Order record in DB. It stays AWAITING_PAYMENT until the receipt
    // is verified, so a shopper who closes the payment sheet does not leave
    // behind a row that looks like a real order to them, to the tracking page
    // or to the studio's fulfilment queue.
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
        orderStatus: AWAITING_PAYMENT,
        paymentMethod: 'RAZORPAY',
        razorpayOrderId,
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
      include: {
        items: true,
        shippingAddress: true,
      },
    });

    // 6. Place a 7-minute temporary hold on these items for this checkout session
    await reserveCartStock({
      sessionId,
      orderId: order.id,
      items: cart.items.map((i) => ({
        variantId: i.variantId,
        productId: i.productId,
        quantity: i.quantity,
      })),
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
        name: address.fullName,
        email: contact.email,
        phone: contact.phone,
      },
    });
  } catch (error) {
    if (error instanceof CartError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Error creating order:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
