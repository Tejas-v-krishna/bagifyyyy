import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { sendEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      // Return success to prevent email enumeration
      return NextResponse.json({ success: true });
    }

    // Invalidate any previous tokens for this email
    await prisma.passwordResetToken.updateMany({
      where: { email: email.toLowerCase(), used: false },
      data: { used: true },
    });

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: {
        token,
        email: email.toLowerCase(),
        expiresAt,
        used: false,
      },
    });

    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

    await sendEmail({
      to: email,
      subject: 'Reset your BAGIFYYYY password',
      html: `
        <div style="font-family: monospace; max-width: 600px; margin: 0 auto; padding: 24px; background: #f8f5e9;">
          <h2 style="font-family: sans-serif; font-size: 20px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; color: #232D3B;">
            Password Reset
          </h2>
          <p style="color: #232D3B; line-height: 1.7; margin-top: 12px;">
            We received a request to reset the password for your BAGIFYYYY account (<b>${email}</b>).
            Click the button below to set a new password. This link expires in 1 hour.
          </p>
          <a href="${resetLink}" style="display: inline-block; margin-top: 24px; background: #232D3B; color: #F8F5E9; padding: 14px 32px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.12em; text-decoration: none; font-size: 13px;">
            RESET PASSWORD →
          </a>
          <p style="margin-top: 24px; font-size: 11px; color: #999;">
            If you didn't request this, ignore this email — your password won't change.<br />
            Link: ${resetLink}
          </p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Failed to send reset email.' }, { status: 500 });
  }
}
