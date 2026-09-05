import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthedUser } from '@/lib/userSession';

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

// PATCH: update display name and avatar for the logged-in user
export async function PATCH(request: Request) {
  const user = await getAuthedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }

    const data: { name?: string | null; avatar?: string | null } = {};
    const { name, avatar } = body as { name?: unknown; avatar?: unknown };

    if (name !== undefined) {
      if (name !== null && typeof name !== 'string') {
        return NextResponse.json({ error: 'Name must be text.' }, { status: 400 });
      }
      const clean = typeof name === 'string' ? name.trim().replace(/\s+/g, ' ') : '';
      if (clean.length > 60) {
        return NextResponse.json({ error: 'Name must be 60 characters or fewer.' }, { status: 400 });
      }
      data.name = clean || null;
    }

    if (avatar !== undefined) {
      if (avatar !== null && typeof avatar !== 'string') {
        return NextResponse.json({ error: 'Avatar must be a URL.' }, { status: 400 });
      }
      const clean = typeof avatar === 'string' ? avatar.trim() : '';
      if (clean) {
        if (clean.length > 500 || !isHttpUrl(clean)) {
          return NextResponse.json({ error: 'Avatar must be a valid http(s) URL.' }, { status: 400 });
        }
        data.avatar = clean;
      } else {
        data.avatar = null;
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data,
      select: { id: true, email: true, name: true, avatar: true, googleId: true },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: 'Failed to update profile.' }, { status: 500 });
  }
}
