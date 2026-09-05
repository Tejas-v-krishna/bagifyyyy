import { NextResponse } from 'next/server';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { getAuthedUser } from '@/lib/userSession';

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const IMAGE_EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/avif': '.avif',
  'image/gif': '.gif',
};

// POST: upload a profile picture from the device gallery.
// Session-authed; stores under public/uploads/avatars and returns its URL.
export async function POST(request: Request) {
  const user = await getAuthedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const formData = await request.formData();
    const file = formData.get('avatar') as File | null;

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: 'Choose an image from your gallery.' }, { status: 400 });
    }
    if (!IMAGE_EXTENSIONS[file.type]) {
      return NextResponse.json({ error: 'Only JPEG, PNG, WebP, AVIF, or GIF images are allowed.' }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'Image must be 2 MB or smaller.' }, { status: 400 });
    }

    const avatarsDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
    await mkdir(avatarsDir, { recursive: true });

    const filename = `avatar_${user.id}_${Date.now()}_${crypto.randomBytes(6).toString('hex')}${IMAGE_EXTENSIONS[file.type]}`;
    await writeFile(path.join(avatarsDir, filename), Buffer.from(await file.arrayBuffer()));
    const url = `/uploads/avatars/${filename}`;

    // Best-effort cleanup of the previous uploaded avatar (never touch remote URLs).
    const previous = typeof user.avatar === 'string' ? user.avatar : '';
    if (previous.startsWith('/uploads/avatars/')) {
      const oldName = path.basename(previous);
      if (/^avatar_[A-Za-z0-9_-]+\.[a-z]+$/.test(oldName)) {
        await unlink(path.join(avatarsDir, oldName)).catch(() => {});
      }
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { avatar: url },
      select: { id: true, email: true, name: true, avatar: true, googleId: true },
    });

    return NextResponse.json({ success: true, url, user: updated });
  } catch (error) {
    console.error('Avatar upload error:', error);
    return NextResponse.json({ error: 'Failed to upload avatar.' }, { status: 500 });
  }
}
