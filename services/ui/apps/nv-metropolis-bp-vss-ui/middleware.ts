import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, readSessionToken } from './auth/session';

/**
 * Gates the whole app behind a valid session.
 *
 * Runs on the Edge runtime, so it can only verify the cookie signature — it
 * cannot hit the database. Whether the user still exists and is active is
 * re-checked by currentUser() on the Node side. Treat this as a cheap first
 * filter, not the authorisation boundary.
 */
const PUBLIC_PATHS = [
  '/signin', '/signup', '/forgot-password', '/reset-password',
  '/api/auth/login', '/api/auth/logout',
  '/api/auth/signup/start', '/api/auth/signup/verify',
  '/api/auth/forgot-password', '/api/auth/reset-password',
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next();
  }

  const userId = await readSessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  if (userId) return NextResponse.next();

  // APIs get a 401 they can handle; page loads bounce to sign-in with a
  // return path so the user lands where they were headed.
  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = '/signin';
  url.searchParams.set('next', pathname);
  return NextResponse.redirect(url);
}

export const config = {
  // '/' listed explicitly — the negative-lookahead pattern alone does not
  // reliably match the bare root path in Next's matcher.
  matcher: ['/', '/((?!_next/static|_next/image|favicon.ico|favicon.jpg|__ENV.js).*)'],
};
