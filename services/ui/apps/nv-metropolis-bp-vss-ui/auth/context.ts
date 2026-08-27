import { getUserById } from './store';
import { SESSION_COOKIE, readSessionToken } from './session';
import { UnauthorizedError } from './types';
import type { User, AuthContext } from './types';

export { SESSION_COOKIE, readSessionToken, createSessionToken } from './session';
export { UnauthorizedError } from './types';

type HasCookies = { cookies: Partial<Record<string, string | undefined>> };

/**
 * The signed-in, still-active user, or null. API route handlers and
 * getServerSideProps only.
 *
 * Middleware already rejects unauthenticated requests by signature, but this
 * re-reads and confirms the user still exists and is active (they may have
 * been disabled or deleted since the cookie was issued).
 */
export async function currentUser(req: HasCookies): Promise<User | null> {
  const userId = await readSessionToken(req.cookies[SESSION_COOKIE]);
  if (!userId) return null;
  const user = await getUserById(userId);
  if (!user || user.status !== 'active') return null;
  return user;
}

/** For handlers that must have a user. Throws UnauthorizedError if absent. */
export async function requireUser(req: HasCookies): Promise<AuthContext & { user: User }> {
  const user = await currentUser(req);
  if (!user) throw new UnauthorizedError();
  return { userId: user.id, orgId: user.orgId, user };
}
