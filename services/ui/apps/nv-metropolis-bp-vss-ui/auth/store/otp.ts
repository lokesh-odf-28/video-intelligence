import { q } from '../db';
import type { CreateOtpChallengeInput, OtpChallengeRow, OtpPurpose } from '../types';

// Pure data access only — hashing, expiry policy and attempt limits live in
// auth/otp.ts (the store returns a hash, the flow layer compares it).

export async function createOtpChallenge(input: CreateOtpChallengeInput): Promise<void> {
  await q(
    `INSERT INTO otp_challenge (purpose, email, otp_hash, expires_at, org_name, name, password_hash, user_id, attempts)
     VALUES ($1, lower($2), $3, $4, $5, $6, $7, $8, 0)
     ON CONFLICT (email, purpose) DO UPDATE SET
       otp_hash = $3, expires_at = $4, org_name = $5, name = $6,
       password_hash = $7, user_id = $8, attempts = 0, created_at = now()`,
    [input.purpose, input.email, input.otpHash, input.expiresAt,
     input.orgName ?? null, input.name ?? null, input.passwordHash ?? null, input.userId ?? null],
  );
}

export async function getOtpChallenge(purpose: OtpPurpose, email: string): Promise<OtpChallengeRow | null> {
  const rows = await q(
    `SELECT * FROM otp_challenge WHERE email = lower($1) AND purpose = $2`,
    [email, purpose],
  );
  if (!rows.length) return null;
  const r = rows[0];
  return {
    otpHash: r.otp_hash,
    attempts: r.attempts,
    expiresAt: new Date(r.expires_at).toISOString(),
    orgName: r.org_name ?? undefined,
    name: r.name ?? undefined,
    passwordHash: r.password_hash ?? undefined,
    userId: r.user_id ?? undefined,
  };
}

export async function incrementOtpAttempts(purpose: OtpPurpose, email: string): Promise<void> {
  await q(
    `UPDATE otp_challenge SET attempts = attempts + 1 WHERE email = lower($1) AND purpose = $2`,
    [email, purpose],
  );
}

export async function deleteOtpChallenge(purpose: OtpPurpose, email: string): Promise<void> {
  await q(`DELETE FROM otp_challenge WHERE email = lower($1) AND purpose = $2`, [email, purpose]);
}
