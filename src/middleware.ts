import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from '@/lib/adminSession';

/** Endpoints under the protected prefixes that must stay reachable to everyone. */
const PUBLIC_PATHS = new Set([
  '/studio/login',
  '/api/studio/auth',
  '/api/auth/login',
  '/api/marketing/subscribe',
]);

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (PUBLIC_PATHS.has(path)) {
    return NextResponse.next();
  }

  // The gate used to be `cookie === 'authenticated'`, i.e. a constant any
  // visitor could set for themselves. It is now a signature check against
  // AUTH_SECRET, and it fails closed when that secret is missing.
  const isStudioAuthenticated = await verifyAdminSessionToken(
    request.cookies.get(ADMIN_SESSION_COOKIE)?.value
  );

  if (isStudioAuthenticated) {
    return NextResponse.next();
  }

  const isApiRoute = path.startsWith('/api/');

  if (!isApiRoute) {
    const loginUrl = new URL('/studio/login', request.url);
    loginUrl.searchParams.set('from', path);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.json(
    { error: 'Unauthorized. Authentication required.' },
    { status: 401 }
  );
}

export const config = {
  matcher: [
    '/studio/:path*',
    '/admin/:path*',
    '/api/studio/:path*',
    '/api/admin/:path*',
    '/api/marketing/:path*',
  ],
};
