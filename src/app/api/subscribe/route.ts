import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendWelcomeNewsletterEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    const subscriber = await prisma.subscriber.create({
      data: {
        email: email.toLowerCase().trim(),
      },
    });

    // Send Welcome Email with BAGIFY10 10% coupon
    try {
      await sendWelcomeNewsletterEmail(email.toLowerCase().trim());
    } catch (emailErr) {
      console.warn('Welcome email warning:', emailErr);
    }

    return NextResponse.json({ success: true, subscriber, message: 'Subscribed! Check your inbox for 10% coupon.' }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating subscriber:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Email already subscribed' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
  }
}
