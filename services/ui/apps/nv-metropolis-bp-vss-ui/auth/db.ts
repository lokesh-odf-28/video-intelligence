import { Pool } from 'pg';

// Server-side only. Cached on globalThis so Next.js dev hot-reload does not
// open a new pool on every edit and exhaust connections.
declare global {
  // eslint-disable-next-line no-var
  var __vss_auth_pool: Pool | undefined;
}

export const hasDatabase = Boolean(process.env.DATABASE_URL);

export function pool(): Pool {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set — the auth layer requires a Postgres database');
  }
  if (!globalThis.__vss_auth_pool) {
    globalThis.__vss_auth_pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30_000,
    });
  }
  return globalThis.__vss_auth_pool;
}

export async function q<T = any>(text: string, params: unknown[] = []): Promise<T[]> {
  const res = await pool().query(text, params);
  return res.rows as T[];
}

// Multi-statement writes (org + its owner user) go through here so a failure
// partway cannot leave the rows inconsistent.
export async function withTransaction<T>(
  fn: (query: <R = any>(text: string, params?: unknown[]) => Promise<R[]>) => Promise<T>,
): Promise<T> {
  const client = await pool().connect();
  try {
    await client.query('BEGIN');
    const scoped = async <R = any>(text: string, params: unknown[] = []) =>
      (await client.query(text, params)).rows as R[];
    const result = await fn(scoped);
    await client.query('COMMIT');
    return result;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}
