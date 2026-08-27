import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

type GoogleIdentity = {
  email: string;
  name: string;
  avatar: string;
  googleId: string;
};

class AuthError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = 'AuthError';
    this.status = status;
  }
}

/**
 * Verify a Google ID token (the One Tap / `credential` flow).
 *
 * A verification failure is fatal. There is deliberately no
 * decode-the-payload-anyway fallback: the signature check is the only thing
 * standing between a caller and any account on the site.
 */
async function identityFromIdToken(credential: string, audience: string): Promise<GoogleIdentity> {
  const ticket = await client.verifyIdToken({ idToken: credential, audience });
  const payload = ticket.getPayload();

  if (!payload?.email) {
    throw new AuthError('Google account did not return an email address', 400);
  }
  if (!payload.email_verified) {
    throw new AuthError('Your Google email address is not verified', 400);
  }

  return {
    email: payload.email.toLowerCase(),
    name: payload.name || payload.given_name || 'Google User',
    avatar: payload.picture || '',
    googleId: payload.sub,
  };
}

/**
 * Verify an OAuth access token (the popup / implicit flow the login page uses).
 *
 * The token is exchanged with Google *here*, server-side, so the caller never
 * gets to state their own email. `aud` is checked so an access token minted for
 * some other application cannot be replayed against this one.
 */
async function identityFromAccessToken(accessToken: string, audience: string): Promise<GoogleIdentity> {
  const tokenInfoRes = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken)}`,
    { cache: 'no-store' }
  );
  if (!tokenInfoRes.ok) {
    throw new AuthError('Invalid Google credential', 401);
  }

  const tokenInfo = (await tokenInfoRes.json()) as {
    aud?: string;
    sub?: string;
    email?: string;
    email_verified?: string | boolean;
  };

  if (tokenInfo.aud !== audience) {
    throw new AuthError('Google credential was not issued for this application', 401);
  }
  if (!tokenInfo.email || !tokenInfo.sub) {
    throw new AuthError('Google credential is missing an email address', 400);
  }
  if (tokenInfo.email_verified !== true && tokenInfo.email_verified !== 'true') {
    throw new AuthError('Your Google email address is not verified', 400);
  }

  // Display name and picture are cosmetic, so a failure here is not fatal.
  let name = '';
  let avatar = '';
  try {
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    });
    if (profileRes.ok) {
      const profile = (await profileRes.json()) as { name?: string; given_name?: string; picture?: string };
      name = profile.name || profile.given_name || '';
      avatar = profile.picture || '';
    }
  } catch (profileErr) {
    console.warn('Could not load Google profile details:', profileErr);
  }

  return {
    email: tokenInfo.email.toLowerCase(),
    name: name || 'Google User',
    avatar,
    googleId: tokenInfo.sub,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { credential, accessToken } = body as { credential?: unknown; accessToken?: unknown };
    const hasCredential = typeof credential === 'string' && credential.length > 0;
    const hasAccessToken = typeof accessToken === 'string' && accessToken.length > 0;

    if (!hasCredential && !hasAccessToken) {
      return NextResponse.json({ error: 'No Google credential provided' }, { status: 400 });
    }

    const googleClientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!googleClientId || googleClientId.includes('your-google-client-id')) {
      console.error('Google sign-in attempted but GOOGLE_CLIENT_ID is not configured.');
      return NextResponse.json(
        { error: 'Google sign-in is not configured on this server.' },
        { status: 503 }
      );
    }

    let identity: GoogleIdentity;
    try {
      identity = hasCredential
        ? await identityFromIdToken(credential as string, googleClientId)
        : await identityFromAccessToken(accessToken as string, googleClientId);
    } catch (verifyErr) {
      if (verifyErr instanceof AuthError) {
        return NextResponse.json({ error: verifyErr.message }, { status: verifyErr.status });
      }
      console.warn('Google token verification failed:', verifyErr);
      return NextResponse.json({ error: 'Invalid Google credential' }, { status: 401 });
    }

    const { email, name, avatar, googleId } = identity;

    // 3. Upsert user in database
    let user = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { googleId }],
      },
    });

    if (user) {
      // Update googleId and avatar if missing
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: user.googleId || googleId || null,
          avatar: avatar || user.avatar,
          name: user.name || name,
        },
      });
    } else {
      // Create new Google User
      user = await prisma.user.create({
        data: {
          email,
          name,
          avatar,
          googleId,
          password: null,
        },
      });
    }

    // 4. Set session cookie (signed)
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
    });

    const { USER_SESSION_COOKIE, userSessionCookieOptions, createUserSessionToken } = await import('@/lib/userSession');
    const token = (await createUserSessionToken(user.id)) || user.id;
    response.cookies.set(USER_SESSION_COOKIE, token, userSessionCookieOptions());

    return response;
  } catch (error) {
    console.error('Google Auth error:', error);
    return NextResponse.json({ error: 'Failed to authenticate with Google' }, { status: 500 });
  }
}
