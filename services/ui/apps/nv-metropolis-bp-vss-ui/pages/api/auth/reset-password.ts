import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserById, updateUserPassword } from '../../../auth/store';
import { hashPassword } from '../../../auth/password';
import { checkOtp } from '../../../auth/otp';

const REASON_MESSAGE: Record<string, string> = {
  not_found: 'No reset in progress for this email — request a new code',
  expired: 'That code has expired — request a new one',
  too_many_attempts: 'Too many incorrect attempts — request a new code',
  wrong_code: 'Incorrect code',
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, code, password } = (req.body ?? {}) as {
    email?: string; code?: string; password?: string;
  };
  if (!email || !code) return res.status(400).json({ error: 'Email and code are required' });
  if (!password || password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  const result = await checkOtp('reset', email, code);
  if (!result.ok) return res.status(400).json({ error: REASON_MESSAGE[result.reason] });

  const user = await getUserById(result.userId!);
  if (!user || user.status !== 'active') {
    return res.status(400).json({ error: 'This account is no longer available' });
  }

  await updateUserPassword(user.id, await hashPassword(password));

  // No auto-login — the user signs in with the new password (design decision).
  return res.status(200).json({ data: { ok: true } });
}
