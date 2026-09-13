import { NextResponse } from 'next/server';
import {
  ADMIN_SESSION_COOKIE,
  adminSessionCookieOptions,
  createAdminSessionToken,
  isAdminSessionConfigured,
  secretsMatch,
} from '@/lib/adminSession';
import { verifyTOTP } from '@/lib/totp';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const password = body && typeof body === 'object' ? (body as { password?: unknown }).password : null;
    const code = body && typeof body === 'object' ? (body as { code?: unknown }).code : null;

    if (typeof password !== 'string' || !password) {
      return NextResponse.json({ error: 'Invalid admin password' }, { status: 401 });
    }

    const expectedPassword = process.env.ADMIN_PASSWORD;
    if (!expectedPassword) {
      console.error('Studio login attempted but ADMIN_PASSWORD is not set.');
      return NextResponse.json(
        { error: 'Studio access is not configured on this server.' },
        { status: 503 }
      );
    }
    if (!isAdminSessionConfigured()) {
      console.error('Studio login attempted but AUTH_SECRET is missing or too short.');
      return NextResponse.json(
        { error: 'Studio access is not configured on this server.' },
        { status: 503 }
      );
    }

    if (!(await secretsMatch(password, expectedPassword))) {
      return NextResponse.json({ error: 'Invalid admin password' }, { status: 401 });
    }

    // ── TWO-FACTOR AUTHENTICATION (TOTP) ────────────────────────────────────
    const totpSecret = process.env.ADMIN_TOTP_SECRET?.trim();
    if (totpSecret) {
      // If code was not supplied, request Step 2 (2FA code)
      if (!code || typeof code !== 'string') {
        return NextResponse.json({ requires2FA: true });
      }

      // Verify the 6-digit code from Google Authenticator
      const isCodeValid = verifyTOTP(code, totpSecret);
      if (!isCodeValid) {
        return NextResponse.json(
          { error: 'Invalid 6-digit authenticator code. Please check Google Authenticator.' },
          { status: 401 }
        );
      }
    }

    const token = await createAdminSessionToken();
    if (!token) {
      return NextResponse.json(
        { error: 'Studio access is not configured on this server.' },
        { status: 503 }
      );
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set(ADMIN_SESSION_COOKIE, token, adminSessionCookieOptions());
    return response;
  } catch (error) {
    console.error('Studio auth error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
