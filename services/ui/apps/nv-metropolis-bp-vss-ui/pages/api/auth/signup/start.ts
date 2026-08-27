import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserByEmail } from '../../../../auth/store';
import { hashPassword } from '../../../../auth/password';
import { issueOtp } from '../../../../auth/otp';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Step 1 of signup: validate, hash the password, email a code. No app_user row
 * exists yet — org/name/passwordHash ride along on the otp_challenge until
 * /verify confirms the code, so an unfinished signup never creates a dangling
 * account.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (process.env.ALLOW_SIGNUP === 'false') {
    return res.status(403).json({ error: 'Sign-up is currently disabled' });
  }

  const { orgName, name, email, password } = (req.body ?? {}) as {
    orgName?: string; name?: string; email?: string; password?: string;
  };
  if (!orgName?.trim() || !name?.trim()) {
    return res.status(400).json({ error: 'Organization and your name are required' });
  }
  if (!email || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'Enter a valid email address' });
  }
  if (!password || password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  // Fast, friendly error — app_user's UNIQUE(email) is still the real guard at
  // /verify time against two concurrent signups for the same address.
  if (await getUserByEmail(email)) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  await issueOtp({
    purpose: 'signup',
    email,
    subject: 'Verify your email',
    bodyPrefix: 'Your verification code is',
    payload: { orgName: orgName.trim(), name: name.trim(), passwordHash: await hashPassword(password) },
  });

  return res.status(200).json({ data: { ok: true } });
}
