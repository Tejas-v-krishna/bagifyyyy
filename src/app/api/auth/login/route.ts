import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import {
  ADMIN_SESSION_COOKIE,
  adminSessionCookieOptions,
  createAdminSessionToken,
  secretsMatch,
} from '@/lib/adminSession';
import {
  USER_SESSION_COOKIE,
  userSessionCookieOptions,
  createUserSessionToken,
} from '@/lib/userSession';
import { createHash } from 'crypto';

// Legacy SHA256 for migration — checked only to upgrade old hashes
function legacyHash(password: string): string {
  return createHash('sha256').update(password + 'bagify-salt').digest('hex');
}

/** The one configured admin identity. An email alone grants nothing. */
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@bagifyyyy.com').toLowerCase();

// POST /api/auth/login
export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const isAdminAttempt = cleanEmail === ADMIN_EMAIL;

    // ── Dedicated Admin Login Path ──────────────────────────────────────────
    if (isAdminAttempt) {
      // 'BagifyAdmin#2026' and 'bagifyadmin' used to be accepted in every
      // deployment no matter what ADMIN_PASSWORD said, and both were committed
      // to the repository.
      const expectedPassword = process.env.ADMIN_PASSWORD;
      if (!expectedPassword) {
        console.error('Admin login attempted but ADMIN_PASSWORD is not set.');
        return NextResponse.json(
          { error: 'Admin access is not configured on this server.' },
          { status: 503 }
        );
      }

      if (!(await secretsMatch(password, expectedPassword))) {
        return NextResponse.json({ error: 'Incorrect admin password' }, { status: 401 });
      }

      const studioToken = await createAdminSessionToken();
      if (!studioToken) {
        console.error('Admin login attempted but AUTH_SECRET is missing or too short.');
        return NextResponse.json(
          { error: 'Admin access is not configured on this server.' },
          { status: 503 }
        );
      }

      // Upsert admin user in database so all foreign keys / user profile lookups succeed
      let adminUser = await prisma.user.findUnique({ where: { email: cleanEmail } });
      if (!adminUser) {
        const hashed = await bcrypt.hash(password, 12);
        adminUser = await prisma.user.create({
          data: {
            email: cleanEmail,
            name: 'Bagify Admin',
            password: hashed,
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

      // Set signed user session cookie
      const userToken = (await createUserSessionToken(adminUser.id)) || adminUser.id;
      response.cookies.set(USER_SESSION_COOKIE, userToken, userSessionCookieOptions());

      // Signed studio session — see src/lib/adminSession.ts
      response.cookies.set(ADMIN_SESSION_COOKIE, studioToken, adminSessionCookieOptions());

      return response;
    }

    // ── Standard Customer Login Path ─────────────────────────────────────────
    const user = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (!user) {
      return NextResponse.json({ error: 'Incorrect email or password' }, { status: 401 });
    }

    if (!user.password) {
      return NextResponse.json({ error: 'Please sign in with Google.' }, { status: 401 });
    }

    let passwordValid = false;
    // Try bcrypt first
    try {
      passwordValid = await bcrypt.compare(password, user.password);
    } catch {
      passwordValid = false;
    }
    // Fallback for legacy SHA256 hashes — upgrade on success
    if (!passwordValid && user.password === legacyHash(password)) {
      passwordValid = true;
      const upgraded = await bcrypt.hash(password, 12);
      await prisma.user.update({ where: { id: user.id }, data: { password: upgraded } });
    }

    if (!passwordValid) {
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

    const userToken = (await createUserSessionToken(user.id)) || user.id;
    response.cookies.set(USER_SESSION_COOKIE, userToken, userSessionCookieOptions());

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Failed to log in' }, { status: 500 });
  }
}

// DELETE /api/auth/login — log out
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(USER_SESSION_COOKIE, '', { maxAge: 0, path: '/' });
  response.cookies.set(ADMIN_SESSION_COOKIE, '', { maxAge: 0, path: '/' });
  return response;
}
