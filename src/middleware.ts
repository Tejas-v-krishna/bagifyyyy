import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from '@/lib/adminSession';

/** Studio endpoints that are publicly reachable only on the admin host */
const PUBLIC_STUDIO_PATHS = new Set([
  '/studio/login',
  '/api/studio/auth',
]);

/** Login API must answer on the public host too — otherwise the secret-path
    login form has nothing to talk to. It only mints sessions for the right
    password and reveals no UI. */
const PUBLIC_STUDIO_API_PATHS = new Set([
  '/api/studio/auth',
]);

/** General public auth/subscription endpoints that shoppers use on main store */
const PUBLIC_STORE_PATHS = new Set([
  '/api/auth/login',
  '/api/subscribe',
]);

function getRequestHost(request: NextRequest): string {
  // Prefer the platform-controlled Host header. Forwarded headers can be
  // supplied by an untrusted client when the deployment proxy does not
  // overwrite them, which would make host isolation spoofable.
  const host = request.headers.get('host') || request.headers.get('x-forwarded-host') || '';
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

/**
 * Unguessable admin entry path, e.g. ADMIN_PATH_PREFIX="studio-k7q2…" maps
 * `/studio-k7q2…/login` → `/studio/login`. Lets the owner reach the portal
 * from the public domain while `/admin` and `/studio` stay cloaked (404)
 * for everyone else. No DNS or subdomain needed. Empty/unset = disabled.
 */
function getAdminPathPrefix(): string | null {
  const raw = process.env.ADMIN_PATH_PREFIX?.trim().replace(/^\/+|\/+$/g, '');
  return raw ? raw : null;
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const host = getRequestHost(request);
  const isTargetingAdminHost = isAdminHost(host);
  const isLocalDevHost = isLocalDevelopmentHost(host);

  // Verify once per request; reused by the cloaking exemption and Layer 3.
  let authed: boolean | null = null;
  const hasValidAdminSession = async (): Promise<boolean> => {
    if (authed === null) {
      authed = await verifyAdminSessionToken(
        request.cookies.get(ADMIN_SESSION_COOKIE)?.value
      );
    }
    return authed;
  };

  // ── LAYER 1.5: SECRET ADMIN PATH ─────────────────────────────────────────
  const adminPrefix = getAdminPathPrefix();
  if (adminPrefix && (path === `/${adminPrefix}` || path.startsWith(`/${adminPrefix}/`))) {
    const suffix = path.slice(adminPrefix.length + 1); // '' | '/login' | '/orders' …
    const studioPath = `/studio${suffix}`;
    // Strangers get the login screen at most — never the portal shell.
    if (!PUBLIC_STUDIO_PATHS.has(studioPath) && !(await hasValidAdminSession())) {
      const loginUrl = new URL(`/${adminPrefix}/login`, request.url);
      loginUrl.searchParams.set('from', studioPath);
      return NextResponse.redirect(loginUrl);
    }
    const studioUrl = new URL(studioPath, request.url);
    request.nextUrl.searchParams.forEach((value, key) => {
      studioUrl.searchParams.set(key, value);
    });
    return NextResponse.rewrite(studioUrl);
  }

  const targetingAdminRoute = isAdminPath(path);

  // ── LAYER 2: HOST ISOLATION & CLOAKING ─────────────────────────────────────
  // If an admin/studio path is accessed from the public storefront domain (e.g. bagifyyyy.com),
  // return 404 Not Found so the admin portal is completely invisible to visitors and crawlers.
  // Exception: the signed-in owner (valid session cookie) may use /studio on the main
  // domain — this is what makes the secret-path login land somewhere usable.
  if (!isTargetingAdminHost && !isLocalDevHost && targetingAdminRoute) {
    if (PUBLIC_STUDIO_API_PATHS.has(path) || (await hasValidAdminSession())) {
      return NextResponse.next();
    }
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

  const isStudioAuthenticated = await hasValidAdminSession();

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

