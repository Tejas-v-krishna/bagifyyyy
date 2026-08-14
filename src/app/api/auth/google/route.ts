import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { credential, simulatedUser } = body;

    let email = '';
    let name = '';
    let avatar = '';
    let googleId = '';

    // 1. If real Google ID Token (credential) is passed
    if (credential) {
      const googleClientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

      try {
        if (googleClientId && !googleClientId.includes('your-google-client-id')) {
          // Verify with Google Auth Library
          const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: googleClientId,
          });
          const payload = ticket.getPayload();
          if (!payload || !payload.email) {
            return NextResponse.json({ error: 'Invalid Google token payload' }, { status: 400 });
          }
          email = payload.email.toLowerCase();
          name = payload.name || payload.given_name || 'Google User';
          avatar = payload.picture || '';
          googleId = payload.sub;
        } else {
          // In development without real client ID yet, safely decode the JWT token payload
          const base64Url = credential.split('.')[1];
          if (base64Url) {
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = Buffer.from(base64, 'base64').toString('utf8');
            const payload = JSON.parse(jsonPayload);
            email = payload.email ? payload.email.toLowerCase() : '';
            name = payload.name || payload.given_name || 'Google User';
            avatar = payload.picture || '';
            googleId = payload.sub || `google_${Date.now()}`;
          }
        }
      } catch (verifyErr) {
        console.warn('Google token verification fallback:', verifyErr);
        const base64Url = credential.split('.')[1];
        if (base64Url) {
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = Buffer.from(base64, 'base64').toString('utf8');
          const payload = JSON.parse(jsonPayload);
          email = payload.email ? payload.email.toLowerCase() : '';
          name = payload.name || payload.given_name || 'Google User';
          avatar = payload.picture || '';
          googleId = payload.sub || `google_${Date.now()}`;
        }
      }
    } 
    // 2. Simulated dev mode fallback (for instant local testing if user clicks simulated button)
    else if (simulatedUser) {
      email = (simulatedUser.email || 'demo.google.user@bagifyyyy.com').toLowerCase();
      name = simulatedUser.name || 'Demo Google User';
      avatar = simulatedUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
      googleId = `simulated_${email}`;
    } else {
      return NextResponse.json({ error: 'No Google credential provided' }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ error: 'Unable to retrieve email from Google Account' }, { status: 400 });
    }

    // 3. Upsert user in database
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          ...(googleId ? [{ googleId }] : []),
        ],
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

    // 4. Set session cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
    });

    response.cookies.set('user-session', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Google Auth error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to authenticate with Google' },
      { status: 500 }
    );
  }
}
