import type { NextApiRequest, NextApiResponse } from 'next';
import { createOrgAndUser, getUserByEmail } from '../../../../auth/store';
import { checkOtp } from '../../../../auth/otp';
import { createSessionToken } from '../../../../auth/session';
import { setSessionCookie } from '../../../../auth/cookie';

const REASON_MESSAGE: Record<string, string> = {
  not_found: 'No pending sign-up for this email — start again',
  expired: 'That code has expired — request a new one',
  too_many_attempts: 'Too many incorrect attempts — request a new code',
  wrong_code: 'Incorrect code',
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, code } = (req.body ?? {}) as { email?: string; code?: string };
  if (!email || !code) return res.status(400).json({ error: 'Email and code are required' });

  const result = await checkOtp('signup', email, code);
  if (!result.ok) return res.status(400).json({ error: REASON_MESSAGE[result.reason] });

  // Race guard: checkOtp deletes on first success, but the account could have
  // been created by a different path in between.
  if (await getUserByEmail(email)) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  const user = await createOrgAndUser({
    orgName: result.orgName!, name: result.name!, email, passwordHash: result.passwordHash!,
  });

  const { token, maxAge } = await createSessionToken(user.id);
  setSessionCookie(res, token, maxAge);
  return res.status(201).json({ data: { id: user.id, name: user.name, email: user.email, role: user.role } });
}
