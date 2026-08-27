import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { USER_SESSION_COOKIE, userSessionCookieOptions, createUserSessionToken } from '@/lib/userSession';

// POST /api/auth/register
export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = typeof name === 'string' ? name.trim() : null;

    // Check if user already exists (case-insensitive)
    const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email: cleanEmail, password: hashed, name: cleanName || null },
    });

    // Set session cookie
    const response = NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name },
    }, { status: 201 });

    const token = (await createUserSessionToken(user.id)) || user.id;
    response.cookies.set(USER_SESSION_COOKIE, token, userSessionCookieOptions());

    return response;
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
  }
}
