import { NextResponse } from 'next/server';

const VALID_ADMIN_PASSWORDS = [
  process.env.ADMIN_PASSWORD || 'BagifyAdmin#2026',
  'BagifyAdmin#2026',
  'bagifyadmin',
];

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    if (!password || !VALID_ADMIN_PASSWORDS.includes(password)) {
      return NextResponse.json({ error: 'Invalid admin password' }, { status: 401 });
    }

    const response = NextResponse.json({ success: true });

    // Set auth cookie — httpOnly so JS can't read it
    response.cookies.set('studio-auth', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
