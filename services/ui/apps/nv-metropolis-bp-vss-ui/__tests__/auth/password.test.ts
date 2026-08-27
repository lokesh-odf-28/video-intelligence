/** @jest-environment node */
import { hashPassword, verifyPassword } from '../../auth/password';

test('hash is not the plaintext and verifies', async () => {
  const h = await hashPassword('correct horse');
  expect(h).not.toContain('correct horse');
  expect(await verifyPassword('correct horse', h)).toBe(true);
});

test('wrong password fails', async () => {
  const h = await hashPassword('correct horse');
  expect(await verifyPassword('battery staple', h)).toBe(false);
});

test('null / malformed stored hash fails safely', async () => {
  expect(await verifyPassword('x', null)).toBe(false);
  expect(await verifyPassword('x', 'bcrypt$nope')).toBe(false);
  expect(await verifyPassword('x', 'scrypt$onlyonepart')).toBe(false);
});
