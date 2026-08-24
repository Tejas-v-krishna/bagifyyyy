import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from '@/lib/adminSession';

/**
 * Route-handler admin guard.
 *
 * Middleware already covers these paths, but each handler checks again: a
 * matcher typo, a rewrite, or a route moved out from under the matcher would
 * otherwise silently open the admin API. Defence in depth is cheap here.
 */
export async function isStudioAuthed(): Promise<boolean> {
  const cookieStore = await cookies();
  return verifyAdminSessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
}

/** Returns a 401 response when the caller is not an admin, otherwise null. */
export async function requireStudioAuth(): Promise<NextResponse | null> {
  if (await isStudioAuthed()) return null;
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
