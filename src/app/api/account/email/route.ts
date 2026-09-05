import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthedUser } from '@/lib/userSession';
import { tierForPoints } from '@/lib/loyalty';
import bcrypt from 'bcryptjs';

// POST: change the account email. Moves loyalty points/history to the new
// email so members never lose points by updating their address.
export async function POST(request: Request) {
  const user = await getAuthedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json().catch(() => null);
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    const currentPassword = typeof body?.currentPassword === 'string' ? body.currentPassword : '';

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
    }
    if (email === user.email.toLowerCase()) {
      return NextResponse.json({ error: 'This is already your email address.' }, { status: 400 });
    }

    const taken = await prisma.user.findUnique({ where: { email } });
    if (taken) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
    }

    if (user.password) {
      if (!currentPassword) {
        return NextResponse.json({ error: 'Enter your current password to change email.' }, { status: 400 });
      }
      const ok = await bcrypt.compare(currentPassword, user.password);
      if (!ok) {
        return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 401 });
      }
    }

    const oldEmail = user.email.toLowerCase();

    const updated = await prisma.$transaction(async (tx) => {
      const next = await tx.user.update({
        where: { id: user.id },
        data: { email },
        select: { id: true, email: true, name: true, avatar: true, googleId: true },
      });

      const oldAccount = await tx.loyaltyAccount.findUnique({ where: { email: oldEmail } });
      if (oldAccount) {
        const newAccount = await tx.loyaltyAccount.upsert({
          where: { email },
          create: { email, points: 0, tier: 'CHROME' },
          update: {},
        });
        if (newAccount.id !== oldAccount.id) {
          await tx.pointTransaction.updateMany({
            where: { loyaltyAccountId: oldAccount.id },
            data: { loyaltyAccountId: newAccount.id },
          });
          const merged = await tx.loyaltyAccount.findUnique({ where: { id: newAccount.id } });
          const total = (merged?.points ?? 0) + oldAccount.points;
          await tx.loyaltyAccount.update({
            where: { id: newAccount.id },
            data: { points: total, tier: tierForPoints(total) },
          });
          await tx.loyaltyAccount.delete({ where: { id: oldAccount.id } });
        }
      }

      return next;
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error) {
    console.error('Change email error:', error);
    return NextResponse.json({ error: 'Failed to change email.' }, { status: 500 });
  }
}
