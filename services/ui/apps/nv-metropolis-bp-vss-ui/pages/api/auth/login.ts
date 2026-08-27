import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserByEmail } from '../../../auth/store';
import { verifyPassword } from '../../../auth/password';
import { createSessionToken } from '../../../auth/session';
import { setSessionCookie } from '../../../auth/cookie';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, password } = (req.body ?? {}) as { email?: string; password?: string };
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = await getUserByEmail(email);
  const ok = await verifyPassword(password, user?.passwordHash ?? null);

  // Same message whether the address is unknown, the password is wrong, or the
  // account is disabled — otherwise this becomes an account-enumeration oracle.
  if (!user || !ok || user.status !== 'active') {
    return res.status(401).json({ error: 'Incorrect email or password' });
  }

  const { token, maxAge } = await createSessionToken(user.id);
  setSessionCookie(res, token, maxAge);
  return res.status(200).json({ data: { id: user.id, name: user.name, email: user.email, role: user.role } });
}
