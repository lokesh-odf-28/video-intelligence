import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { FieldError, inputClass, buttonClass } from './AuthShell';

export function SignInForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const f = new FormData(e.currentTarget);
    const r = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: f.get('email'), password: f.get('password') }),
    });
    if (!r.ok) {
      setBusy(false);
      setError((await r.json().catch(() => ({}))).error ?? 'Sign in failed');
      return;
    }
    const next = typeof router.query.next === 'string' && router.query.next.startsWith('/')
      ? router.query.next : '/';
    router.replace(next);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input name="email" type="email" required placeholder="Email" autoComplete="email" className={inputClass} />
      <input name="password" type="password" required placeholder="Password" autoComplete="current-password" className={inputClass} />
      <FieldError message={error} />
      <button disabled={busy} className={buttonClass}>{busy ? 'Signing in…' : 'Sign in'}</button>
      <div className="flex justify-between text-xs text-neutral-400">
        <Link href="/signup" className="hover:text-neutral-200">Create account</Link>
        <Link href="/forgot-password" className="hover:text-neutral-200">Forgot password?</Link>
      </div>
    </form>
  );
}
