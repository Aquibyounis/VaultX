import { NextRequest, NextResponse } from 'next/server';
import { validateSessionToken, SESSION_COOKIE } from './lib/session';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for public routes
  const publicPaths = ['/lock', '/api/auth', '/api/init', '/api/ping', '/api/test-dashboard'];
  const isPublic = publicPaths.some(p => pathname.startsWith(p));
  const isStatic = pathname.startsWith('/_next') || 
                   pathname.startsWith('/icons') || 
                   pathname.startsWith('/sw.js') ||
                   pathname === '/favicon.ico' ||
                   pathname === '/manifest.webmanifest';

  if (isPublic || isStatic) {
    return NextResponse.next();
  }

  // Validate session
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/lock', request.url));
  }

  const session = validateSessionToken(token);
  if (!session) {
    const response = pathname.startsWith('/api/')
      ? NextResponse.json({ error: 'Session expired' }, { status: 401 })
      : NextResponse.redirect(new URL('/lock', request.url));
    
    response.cookies.delete(SESSION_COOKIE);
    return response;
  }

  // Add session info to headers for downstream use
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-session-role', session.role);
  requestHeaders.set('x-session-expires', session.expiresAt.toString());

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons/|sw.js|manifest.webmanifest).*)',
  ],
};
