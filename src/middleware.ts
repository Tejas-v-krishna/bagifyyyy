import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_PREFIX = '/studio';
const LOGIN_PATH = '/studio/login';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only guard /studio routes
  if (!pathname.startsWith(PROTECTED_PREFIX)) {
    return NextResponse.next();
  }

  // Allow the login page through unconditionally
  if (pathname === LOGIN_PATH || pathname.startsWith('/studio/login')) {
    return NextResponse.next();
  }

  // Allow API auth routes through
  if (pathname.startsWith('/api/studio/')) {
    return NextResponse.next();
  }

  // Check for auth cookie
  const authCookie = request.cookies.get('studio-auth');
  if (!authCookie || authCookie.value !== 'authenticated') {
    const loginUrl = new URL(LOGIN_PATH, request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/studio/:path*'],
};
