// Auth domain types. Mirrors db/schema.sql.

export type UserRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface User {
  id: string;
  orgId: string;
  email: string;
  name: string;
  role: UserRole;
  status: 'active' | 'invited' | 'disabled';
}

/** Only ever used inside the login handler — never returned to a client. */
export interface UserWithSecret extends User {
  passwordHash: string | null;
}

/** Who is acting. Threaded into writes so rows land in the right org. */
export interface AuthContext {
  userId: string;
  orgId: string;
}

/** Signup creates an organization and its one owner user atomically. */
export interface SignUpInput {
  orgName: string;
  name: string;
  email: string;
  passwordHash: string;
}

export type OtpPurpose = 'signup' | 'reset';

export interface CreateOtpChallengeInput {
  purpose: OtpPurpose;
  email: string;
  otpHash: string;
  expiresAt: string; // ISO
  orgName?: string;      // signup only
  name?: string;         // signup only
  passwordHash?: string; // signup only — already hashed at issue time
  userId?: string;       // reset only
}

export interface OtpChallengeRow {
  otpHash: string;
  attempts: number;
  expiresAt: string;
  orgName?: string;
  name?: string;
  passwordHash?: string;
  userId?: string;
}

export class UnauthorizedError extends Error {
  constructor() {
    super('not signed in');
    this.name = 'UnauthorizedError';
  }
}
