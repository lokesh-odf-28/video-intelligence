import type { NextApiRequest, NextApiResponse } from 'next';
import { SESSION_COOKIE, readSessionToken } from '../../../auth/session';

// Bodies (incl. multipart uploads) pass through untouched.
export const config = { api: { bodyParser: false } };

const UPSTREAM: Record<string, string | undefined> = {
  agent: process.env.AGENT_API_URL,
  vst: process.env.VST_API_URL,
  alert: process.env.ALERTS_API_URL,
};

const HOP_BY_HOP = new Set([
  'connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization',
  'te', 'trailer', 'transfer-encoding', 'upgrade', 'host', 'content-length',
]);

async function readBody(req: NextApiRequest): Promise<Buffer | undefined> {
  if (req.method === 'GET' || req.method === 'HEAD') return undefined;
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c));
  return chunks.length ? Buffer.concat(chunks) : undefined;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = await readSessionToken(req.cookies[SESSION_COOKIE]);
  if (!userId) return res.status(401).json({ error: 'Not signed in' });

  const segments = ([] as string[]).concat((req.query.path as string[] | string) ?? []);
  const [target, ...rest] = segments;
  if (!(target in UPSTREAM)) {
    return res.status(404).json({ error: `unknown proxy target '${target ?? ''}'` });
  }
  const base = UPSTREAM[target];
  if (!base) return res.status(503).json({ error: `${target} upstream is not configured` });

  const qs = req.url && req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
  const url = `${base.replace(/\/$/, '')}/${rest.join('/')}${qs}`;

  const headers: Record<string, string> = {};
  for (const [k, v] of Object.entries(req.headers)) {
    if (typeof v === 'string' && !HOP_BY_HOP.has(k.toLowerCase())) headers[k] = v;
  }

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      method: req.method,
      headers,
      body: await readBody(req),
      redirect: 'manual',
    });
  } catch (e) {
    console.error('[gw] upstream fetch failed', url, (e as Error).message);
    return res.status(502).json({ error: 'upstream unreachable' });
  }

  res.status(upstream.status);
  upstream.headers.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key.toLowerCase())) res.setHeader(key, value);
  });

  if (upstream.body) {
    const reader = upstream.body.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(Buffer.from(value));
    }
  }
  res.end();
}
