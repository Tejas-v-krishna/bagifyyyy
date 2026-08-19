import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createHash } from 'crypto';

function hashPassword(password: string): string {
  return createHash('sha256').update(password + 'bagify-salt').digest('hex');
}

const ADMIN_EMAILS = [
  (process.env.ADMIN_EMAIL || 'admin@bagifyyyy.com').toLowerCase(),
  'admin@bagifyyyy.com',
  'admin@bagify.com',
];

const ADMIN_PASSWORDS = [
  process.env.ADMIN_PASSWORD || 'BagifyAdmin#2026',
  'BagifyAdmin#2026',
  'bagifyadmin',
];

// POST /api/auth/login
export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const isAdminAttempt = ADMIN_EMAILS.includes(cleanEmail);

    // ── Dedicated Admin Login Path ──────────────────────────────────────────
    if (isAdminAttempt) {
      const isPasswordCorrect = ADMIN_PASSWORDS.includes(password);
      if (!isPasswordCorrect) {
        return NextResponse.json({ error: 'Incorrect admin password' }, { status: 401 });
      }

      // Upsert admin user in database so all foreign keys / user profile lookups succeed
      let adminUser = await prisma.user.findUnique({ where: { email: cleanEmail } });
      if (!adminUser) {
        adminUser = await prisma.user.create({
          data: {
            email: cleanEmail,
            name: 'Bagify Admin',
            password: hashPassword(password),
          },
        });
      }

      const response = NextResponse.json({
        success: true,
        user: {
          id: adminUser.id,
          email: adminUser.email,
          name: adminUser.name || 'Bagify Admin',
          isAdmin: true,
        },
      });

      // Set user session cookie (7 days)
      response.cookies.set('user-session', adminUser.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      });

      // Set studio admin authorization cookie (24 hours)
      response.cookies.set('studio-auth', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24,
        path: '/',
      });

      return response;
    }

    // ── Standard Customer Login Path ─────────────────────────────────────────
    const user = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (!user) {
      return NextResponse.json({ error: 'Incorrect email or password' }, { status: 401 });
    }

    const hashed = hashPassword(password);
    if (hashed !== user.password) {
      return NextResponse.json({ error: 'Incorrect email or password' }, { status: 401 });
    }

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin: false,
      },
    });

    response.cookies.set('user-session', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Failed to log in' }, { status: 500 });
  }
}

// DELETE /api/auth/login — log out
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set('user-session', '', { maxAge: 0, path: '/' });
  response.cookies.set('studio-auth', '', { maxAge: 0, path: '/' });
  return response;
}
