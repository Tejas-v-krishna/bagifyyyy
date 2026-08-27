import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendWelcomeNewsletterEmail } from '@/lib/email';

async function verifyRecaptcha(token?: string): Promise<boolean> {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret || !token) return true; // skip if not configured
  try {
    const res = await fetch(`https://www.google.com/recaptcha/api/siteverify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${encodeURIComponent(secret)}&response=${encodeURIComponent(token)}`,
    });
    const data = await res.json() as { success?: boolean };
    return data.success === true;
  } catch { return false; }
}

export async function POST(request: Request) {
  try {
    const { email, honeypot, recaptchaToken } = await request.json();

    // Honeypot — bots fill hidden field
    if (honeypot) {
      return NextResponse.json({ success: true, message: 'Subscribed! Check your inbox for 10% coupon.' }, { status: 201 });
    }

    if (!(await verifyRecaptcha(recaptchaToken))) {
      return NextResponse.json({ error: 'Captcha verification failed' }, { status: 400 });
    }

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
