import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Paths that require authentication
  const isStudioRoute = path.startsWith('/studio');
  const isAdminRoute = path.startsWith('/admin');
  const isStudioApi = path.startsWith('/api/studio');
  const isAdminApi = path.startsWith('/api/admin');
  const isMarketingApi = path.startsWith('/api/marketing');
  
  // Public exceptions
  if (path === '/studio/login' || path === '/api/studio/auth' || path === '/api/auth/login') {
    return NextResponse.next();
  }

  // Check for the studio authentication cookie
  const studioAuthCookie = request.cookies.get('studio-auth')?.value;
  const userSessionCookie = request.cookies.get('user-session')?.value;
  
  // In Bagify, admin access is sometimes governed by user-session with isAdmin=true in DB,
  // but studio specifically sets `studio-auth`. Let's allow either for API routes.
  const isStudioAuthenticated = studioAuthCookie === 'authenticated';
  
  if (isStudioRoute || isAdminRoute || isStudioApi || isAdminApi || isMarketingApi) {
    // Exclude public marketing endpoints
    if (path === '/api/marketing/subscribe') {
      return NextResponse.next();
    }
    
    if (!isStudioAuthenticated) {
      if (isStudioRoute && !isStudioApi) {
        // Redirect unauthenticated users to studio login
        const loginUrl = new URL('/studio/login', request.url);
        return NextResponse.redirect(loginUrl);
      }
      
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized. Authentication required.' }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/studio/:path*',
    '/admin/:path*',
    '/api/studio/:path*',
    '/api/admin/:path*',
    '/api/marketing/:path*'
  ],
};
