import { q, withTransaction } from '../db';
import type { User, UserWithSecret, SignUpInput } from '../types';

function toUser(r: any): User {
  return { id: r.id, orgId: r.org_id, email: r.email, name: r.name, role: r.role, status: r.status };
}

export async function getUserByEmail(email: string): Promise<UserWithSecret | null> {
  const rows = await q(`SELECT * FROM app_user WHERE lower(email) = lower($1)`, [email]);
  if (!rows.length) return null;
  return { ...toUser(rows[0]), passwordHash: rows[0].password_hash };
}

export async function getUserById(id: string): Promise<User | null> {
  const rows = await q(`SELECT * FROM app_user WHERE id = $1`, [id]);
  return rows.length ? toUser(rows[0]) : null;
}

/**
 * "org = user": one signup call creates both rows in a single transaction,
 * or neither does. Uniqueness is enforced by app_user's UNIQUE(email).
 */
export async function createOrgAndUser(input: SignUpInput): Promise<User> {
  return withTransaction(async (tx) => {
    const org = await tx<{ id: string }>(
      `INSERT INTO organization (name, contact_email) VALUES ($1, $2) RETURNING id`,
      [input.orgName, input.email],
    );
    const orgId = org[0].id;
    const rows = await tx(
      `INSERT INTO app_user (org_id, email, name, role, status, password_hash)
       VALUES ($1, $2, $3, 'owner', 'active', $4)
       RETURNING *`,
      [orgId, input.email, input.name, input.passwordHash],
    );
    return toUser(rows[0]);
  });
}

export async function updateUserPassword(userId: string, passwordHash: string): Promise<void> {
  await q(`UPDATE app_user SET password_hash = $2 WHERE id = $1`, [userId, passwordHash]);
}
