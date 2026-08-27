/** @jest-environment node */
import { createSessionToken, readSessionToken, SESSION_COOKIE } from '../../auth/session';

const OLD_ENV = process.env;
beforeEach(() => { process.env = { ...OLD_ENV, SESSION_SECRET: 'x'.repeat(32) }; });
afterAll(() => { process.env = OLD_ENV; });

test('cookie name is vss_session', () => {
  expect(SESSION_COOKIE).toBe('vss_session');
});

test('round-trips a user id', async () => {
  const { token } = await createSessionToken('user-1');
  expect(await readSessionToken(token)).toBe('user-1');
});

test('rejects a tampered signature', async () => {
  const { token } = await createSessionToken('user-1');
  const bad = token.slice(0, -2) + (token.endsWith('AA') ? 'BB' : 'AA');
  expect(await readSessionToken(bad)).toBeNull();
});

test('rejects a malformed token', async () => {
  expect(await readSessionToken('not.a.token.at.all')).toBeNull();
  expect(await readSessionToken(undefined)).toBeNull();
});

test('expiry cannot be extended client-side', async () => {
  const { token } = await createSessionToken('user-1');
  const [uid, , sig] = token.split('.');
  const future = Date.now() + 999_999_999;
  expect(await readSessionToken(`${uid}.${future}.${sig}`)).toBeNull();
});
