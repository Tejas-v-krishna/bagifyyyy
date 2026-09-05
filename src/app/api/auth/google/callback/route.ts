import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { OAuth2Client } from 'google-auth-library';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  const origin = url.origin;

  if (error || !code) {
    return NextResponse.redirect(`${origin}/?auth_error=${encodeURIComponent(error || "No auth code received")}`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${origin}/api/auth/google/callback`;

  try {
    const oauth2Client = new OAuth2Client(clientId, clientSecret, redirectUri);
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Verify ID Token or fetch user info
    let email = '';
    let name = '';
    let avatar = '';
    let googleId = '';

    if (tokens.id_token) {
      const ticket = await oauth2Client.verifyIdToken({
        idToken: tokens.id_token,
        audience: clientId,
      });
      const payload = ticket.getPayload();
      if (payload && payload.email && payload.email_verified) {
        email = payload.email.toLowerCase();
        name = payload.name || payload.given_name || 'Google Member';
        avatar = payload.picture || '';
        googleId = payload.sub;
      } else if (payload?.email && !payload.email_verified) {
        return NextResponse.redirect(
          `${origin}/?auth_error=${encodeURIComponent('Your Google email address is not verified')}`
        );
      }
    }

    if (!email && tokens.access_token) {
      const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      const userInfo = await userInfoRes.json();
      if (
        !userInfo.email ||
        (userInfo.email_verified !== true && userInfo.email_verified !== 'true')
      ) {
        return NextResponse.redirect(
          `${origin}/?auth_error=${encodeURIComponent('Your Google email address is not verified')}`
        );
      }
      email = (userInfo.email || '').toLowerCase();
      name = userInfo.name || userInfo.given_name || 'Google Member';
      avatar = userInfo.picture || '';
      googleId = userInfo.sub;
    }

    if (!email) {
      return NextResponse.redirect(`${origin}/?auth_error=Email%20not%20found`);
    }

    // Upsert User in Database
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          ...(googleId ? [{ googleId }] : []),
        ],
      },
    });

    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: user.googleId || googleId || null,
          avatar: avatar || user.avatar,
          name: user.name || name,
        },
      });
    } else {
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

    // Set auth session cookie and redirect to account (signed)
    const response = NextResponse.redirect(`${origin}/account`);
    const { USER_SESSION_COOKIE, userSessionCookieOptions, createUserSessionToken } = await import('@/lib/userSession');
    const token = (await createUserSessionToken(user.id)) || user.id;
    response.cookies.set(USER_SESSION_COOKIE, token, userSessionCookieOptions());

    return response;
  } catch (err) {
    console.error("Google Callback Error:", err);
    const message = err instanceof Error ? err.message : "OAuth failed";
    return NextResponse.redirect(`${origin}/?auth_error=${encodeURIComponent(message)}`);
  }
}
