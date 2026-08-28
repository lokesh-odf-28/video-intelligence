import type { NextApiResponse } from 'next';
import { SESSION_COOKIE } from './session';

// The token is `uuid.digits.base64url` — all cookie-safe characters, so no
// encoding is needed. Hand-built to avoid a dependency on the untyped `cookie`
// package.
function serialize(value: string, maxAge: number): string {
  const parts = [
    `${SESSION_COOKIE}=${value}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAge}`,
  ];
  // Secure by default in production. Set SESSION_COOKIE_SECURE=false when the
  // deployment is served over plain HTTP — browsers silently drop a `Secure`
  // cookie sent over http, which would break the session on every request.
  const secure = process.env.SESSION_COOKIE_SECURE
    ? process.env.SESSION_COOKIE_SECURE === 'true'
    : process.env.NODE_ENV === 'production';
  if (secure) parts.push('Secure');
  return parts.join('; ');
}

export function setSessionCookie(res: NextApiResponse, token: string, maxAge: number): void {
  res.setHeader('Set-Cookie', serialize(token, maxAge));
}

export function clearSessionCookie(res: NextApiResponse): void {
  res.setHeader('Set-Cookie', serialize('', 0));
}
