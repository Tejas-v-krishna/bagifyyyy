import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from '@/lib/adminSession';

/** Studio endpoints that are publicly reachable only on the admin host */
const PUBLIC_STUDIO_PATHS = new Set([
  '/studio/login',
  '/api/studio/auth',
]);

/** General public auth/subscription endpoints that shoppers use on main store */
const PUBLIC_STORE_PATHS = new Set([
  '/api/auth/login',
  '/api/subscribe',
]);

function getRequestHost(request: NextRequest): string {
  const forwardedHost = request.headers.get('x-forwarded-host');
  const host = forwardedHost || request.headers.get('host') || '';
  return host.toLowerCase().split(':')[0]; // strip port if present
}

function isAdminHost(host: string): boolean {
  const configuredAdminHost = process.env.ADMIN_HOST?.toLowerCase().split(':')[0];
  if (configuredAdminHost && host === configuredAdminHost) {
    return true;
  }

  // Matches admin.* or studio.* (e.g., admin.bagifyyyy.com, studio.bagifyyyy.com, admin.localhost)
  if (host.startsWith('admin.') || host.startsWith('studio.')) {
    return true;
  }

  return false;
}

function isLocalDevelopmentHost(host: string): boolean {
  return process.env.NODE_ENV === 'development' && (host === 'localhost' || host === '127.0.0.1');
}

function isAdminPath(pathname: string): boolean {
  return (
    pathname.startsWith('/studio') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/api/studio') ||
    pathname.startsWith('/api/admin') ||
    pathname.startsWith('/api/marketing/broadcast') ||
    pathname.startsWith('/api/marketing/campaigns') ||
    pathname.startsWith('/api/marketing/preview')
  );
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const host = getRequestHost(request);
  const isTargetingAdminHost = isAdminHost(host);
  const isLocalDevHost = isLocalDevelopmentHost(host);
  const targetingAdminRoute = isAdminPath(path);

  // ── LAYER 2: HOST ISOLATION & CLOAKING ─────────────────────────────────────
  // If an admin/studio path is accessed from the public storefront domain (e.g. bagifyyyy.com),
  // return 404 Not Found so the admin portal is completely invisible to visitors and crawlers.
  if (!isTargetingAdminHost && !isLocalDevHost && targetingAdminRoute) {
    if (path.startsWith('/api/')) {
      return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    }
    // Mask as 404 on the public storefront
    return NextResponse.rewrite(new URL('/not-found', request.url), { status: 404 });
  }

  // If on admin subdomain and accessing root `/`, rewrite to `/studio`
  if (isTargetingAdminHost && path === '/') {
    const isAuthed = await verifyAdminSessionToken(
      request.cookies.get(ADMIN_SESSION_COOKIE)?.value
    );
    if (!isAuthed) {
      const loginUrl = new URL('/studio/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
    const studioUrl = new URL('/studio', request.url);
    return NextResponse.rewrite(studioUrl);
  }

  // Allow non-admin paths on either host
  if (!targetingAdminRoute) {
    return NextResponse.next();
  }

  // ── LAYER 3: APPLICATION AUTHENTICATION ────────────────────────────────────
  // Allow public studio login form & auth API
  if (PUBLIC_STUDIO_PATHS.has(path) || PUBLIC_STORE_PATHS.has(path)) {
    return NextResponse.next();
  }

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
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public static files (svg, png, jpg, jpeg, gif, webp, woff, woff2)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff|woff2)$).*)',
  ],
};

