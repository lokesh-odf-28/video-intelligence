import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { FieldError, inputClass, buttonClass } from './AuthShell';

export function ResetPasswordForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const f = new FormData(e.currentTarget);
    const r = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: f.get('email'), code: f.get('code'), password: f.get('password') }),
    });
    setBusy(false);
    if (!r.ok) {
      setError((await r.json().catch(() => ({}))).error ?? 'Reset failed');
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <p className="text-sm text-neutral-300">
        Password updated.{' '}
        <Link href="/signin" className="text-green-500 hover:text-green-400">Sign in</Link>{' '}
        with your new password.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input name="email" type="email" required placeholder="Email" autoComplete="email" className={inputClass} />
      <input name="code" inputMode="numeric" pattern="\d{6}" maxLength={6} required
        placeholder="6-digit code" className={`${inputClass} tracking-[0.4em]`} />
      <input name="password" type="password" required minLength={8} placeholder="New password (min 8)"
        autoComplete="new-password" className={inputClass} />
      <FieldError message={error} />
      <button disabled={busy} className={buttonClass}>{busy ? 'Updating…' : 'Update password'}</button>
      <div className="text-xs text-neutral-400">
        <Link href="/signin" className="hover:text-neutral-200">Back to sign in</Link>
      </div>
    </form>
  );
}
