/** @jest-environment node */
jest.mock('../../auth/mail', () => ({ mailer: { send: jest.fn() } }));

const store: any = {};
jest.mock('../../auth/store', () => ({
  createOtpChallenge: jest.fn(async (i: any) => { store.row = { ...i, attempts: 0 }; }),
  getOtpChallenge: jest.fn(async () => store.row ?? null),
  incrementOtpAttempts: jest.fn(async () => { if (store.row) store.row.attempts++; }),
  deleteOtpChallenge: jest.fn(async () => { store.row = null; }),
}));

import { issueOtp, checkOtp, OTP_MAX_ATTEMPTS } from '../../auth/otp';
import { mailer } from '../../auth/mail';

beforeEach(() => { store.row = null; (mailer.send as jest.Mock).mockClear(); });

async function issueAndGetCode() {
  await issueOtp({ purpose: 'signup', email: 'a@b.com', subject: 's', bodyPrefix: 'code' });
  const call = (mailer.send as jest.Mock).mock.calls[0][0].text as string;
  return call.match(/(\d{6})/)![1];
}

test('happy path consumes the challenge', async () => {
  const code = await issueAndGetCode();
  const r = await checkOtp('signup', 'a@b.com', code);
  expect(r.ok).toBe(true);
  expect(await checkOtp('signup', 'a@b.com', code)).toEqual({ ok: false, reason: 'not_found' });
});

test('wrong code increments attempts then blocks', async () => {
  await issueAndGetCode();
  for (let i = 0; i < OTP_MAX_ATTEMPTS; i++) {
    expect((await checkOtp('signup', 'a@b.com', '000000')).ok).toBe(false);
  }
  expect(await checkOtp('signup', 'a@b.com', '000000')).toEqual({ ok: false, reason: 'too_many_attempts' });
});

test('expired code is rejected', async () => {
  await issueAndGetCode();
  store.row.expiresAt = new Date(Date.now() - 1000).toISOString();
  expect((await checkOtp('signup', 'a@b.com', '123456')).reason).toBe('expired');
});

test('payload (orgName/name/passwordHash) round-trips through a successful check', async () => {
  await issueOtp({
    purpose: 'signup', email: 'c@d.com', subject: 's', bodyPrefix: 'code',
    payload: { orgName: 'Acme', name: 'Lee', passwordHash: 'scrypt$x$y' },
  });
  const code = ((mailer.send as jest.Mock).mock.calls[0][0].text as string).match(/(\d{6})/)![1];
  const r = await checkOtp('signup', 'c@d.com', code);
  expect(r).toMatchObject({ ok: true, orgName: 'Acme', name: 'Lee', passwordHash: 'scrypt$x$y' });
});
