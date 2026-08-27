import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserByEmail } from '../../../auth/store';
import { issueOtp } from '../../../auth/otp';

const GENERIC = {
  data: { ok: true, message: 'If an account exists for that email, a code has been sent.' },
};

/**
 * Always the same response whether the address has an account or not — same
 * principle as login's identical error for "unknown email" vs "wrong password".
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email } = (req.body ?? {}) as { email?: string };
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const user = await getUserByEmail(email);
  if (user && user.status === 'active') {
    await issueOtp({
      purpose: 'reset',
      email,
      subject: 'Reset your password',
      bodyPrefix: 'Your password reset code is',
      payload: { userId: user.id },
    });
  }
  return res.status(200).json(GENERIC);
}
