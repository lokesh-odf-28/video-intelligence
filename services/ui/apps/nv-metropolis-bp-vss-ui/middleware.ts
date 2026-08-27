import { NextResponse } from 'next/server';

// Auth gate is added in a later task. For now this is a pass-through so we can
// confirm the stock app still boots with a middleware file present.
export function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|favicon.jpg|__ENV.js).*)'],
};
