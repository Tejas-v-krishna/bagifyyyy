import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { USER_SESSION_COOKIE, verifyUserSessionToken } from '@/lib/userSession';
import { cookies } from 'next/headers';

const ADMIN_EMAILS = [
  (process.env.ADMIN_EMAIL || 'admin@bagifyyyy.com').toLowerCase(),
  'admin@bagifyyyy.com',
  'admin@bagify.com',
];

export async function GET() {
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get(USER_SESSION_COOKIE)?.value;
    const userId = await verifyUserSessionToken(raw);

    if (!userId) {
      return NextResponse.json({ user: null });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        googleId: true,
        password: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ user: null });
    }

    const isAdmin = ADMIN_EMAILS.includes(user.email.toLowerCase());
    const { password: _password, ...profile } = user;

    return NextResponse.json({
      user: {
        ...profile,
        hasPassword: Boolean(_password),
        isAdmin,
      },
    });
  } catch (error) {
    console.error('Error fetching current user:', error);
    return NextResponse.json({ user: null });
  }
}
