import { NextResponse } from 'next/server';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import sharp from 'sharp';
import { prisma } from '@/lib/prisma';
import { getAuthedUser } from '@/lib/userSession';
import {
  IMAGE_FORMATS_HINT,
  extFromFilename,
  extFromMime,
  sniffImageMime,
} from '@/lib/imageFormats';

// Raised from 2 MB: iPhone photos (especially HEIC) routinely exceed 2 MB, and
// the image is resized to 400x400 WebP below anyway, so the input cap is generous.
const MAX_FILE_SIZE = 15 * 1024 * 1024;

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
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'Image must be 15 MB or smaller.' }, { status: 400 });
    }

    // Accept any image/* MIME type or known extension; fall back to sniffing the
    // header for iOS files that arrive with no MIME type and no extension.
    const declaredMime = (file.type || '').toLowerCase().trim();
    const nameHasImageExt = extFromFilename(file.name || '') !== null;
    if (!declaredMime.startsWith('image/') && !nameHasImageExt) {
      const head = new Uint8Array(await file.slice(0, 32).arrayBuffer());
      if (!sniffImageMime(head)) {
        return NextResponse.json(
          { error: `Only image files are allowed (${IMAGE_FORMATS_HINT}).` },
          { status: 400 }
        );
      }
    }

    const avatarsDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
    await mkdir(avatarsDir, { recursive: true });

    const rawBuffer = Buffer.from(await file.arrayBuffer());
    let finalBuffer = rawBuffer;
    let finalExt =
      extFromMime(declaredMime) || extFromFilename(file.name || '') || '.jpg';

    const isGif = declaredMime === 'image/gif' || (file.name || '').toLowerCase().endsWith('.gif');

    if (isGif) {
      finalBuffer = rawBuffer;
      finalExt = '.gif';
    } else {
      try {
        finalBuffer = await sharp(rawBuffer)
          .rotate()
          .resize(400, 400, { fit: 'cover' })
          .webp({ quality: 85 })
          .toBuffer();
        finalExt = '.webp';
      } catch (sharpErr) {
        // Keep the original bytes (and their real extension) if sharp can't decode.
        console.warn('Avatar sharp compression fallback:', sharpErr);
      }
    }

    const filename = `avatar_${user.id}_${Date.now()}_${crypto.randomBytes(6).toString('hex')}${finalExt}`;
    await writeFile(path.join(avatarsDir, filename), finalBuffer);
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
