import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { priceCart, cartTotal, CartError } from '@/lib/cart';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, promoCode, shippingMethod } = body;

    // Prices, names and images are resolved from the database — never taken from
    // the request body, which previously let any cart be bought for ₹1.
    const cart = await priceCart({ items, promoCode, shippingMethod });

    // Check if we are using the mock key
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_mock') {
      console.warn('Using mock Stripe checkout because STRIPE_SECRET_KEY is not set.');
      return NextResponse.json({
        sessionId: 'mock_session_123',
        url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/checkout/success?session_id=mock_session_123`,
      });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-07-29.dahlia',
    });

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: cart.items.map((item) => ({
        price_data: {
          currency: 'inr',
          product_data: {
            name: item.name,
            images: [item.image.startsWith('http') ? item.image : `${appUrl}${item.image}`],
            description: `Size: ${item.size} | Color: ${item.color}`,
          },
          unit_amount: Math.round(item.price * 100), // Convert to paise
        },
        quantity: item.quantity,
      })),
      mode: 'payment',
      success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/checkout/cancel`,
      shipping_address_collection: {
        allowed_countries: ['IN'],
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: { amount: Math.round(cart.shippingFee * 100), currency: 'inr' },
            display_name: cart.shippingFee === 0 ? 'Free Shipping' : 'Standard Shipping',
            delivery_estimate: {
              minimum: { unit: 'business_day', value: 3 },
              maximum: { unit: 'business_day', value: 5 },
            },
          },
        },
      ],
      ...(cart.discountAmount > 0
        ? {
            discounts: [
              {
                coupon: (
                  await stripe.coupons.create({
                    amount_off: Math.round(cart.discountAmount * 100),
                    currency: 'inr',
                    name: cart.promoCode ?? 'Promotion',
                    duration: 'once',
                  })
                ).id,
              },
            ],
          }
        : {}),
      metadata: {
        subtotal: String(cart.subtotal),
        discount: String(cart.discountAmount),
        shipping: String(cart.shippingFee),
        expectedTotal: String(cartTotal(cart)),
        ...(cart.promoCode ? { promoCode: cart.promoCode } : {}),
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    if (error instanceof CartError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Error creating Stripe session:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
