import { useState } from 'react';
import Link from 'next/link';
import { FieldError, inputClass, buttonClass } from './AuthShell';

export function ForgotPasswordForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const f = new FormData(e.currentTarget);
    const r = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: f.get('email') }),
    });
    setBusy(false);
    if (!r.ok) {
      setError((await r.json().catch(() => ({}))).error ?? 'Request failed');
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <p className="text-sm text-neutral-300">
        If an account exists for that email, a reset code has been sent.{' '}
        <Link href="/reset-password" className="text-green-500 hover:text-green-400">Enter it here</Link>.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input name="email" type="email" required placeholder="Email" autoComplete="email" className={inputClass} />
      <FieldError message={error} />
      <button disabled={busy} className={buttonClass}>{busy ? 'Sending…' : 'Send reset code'}</button>
      <div className="text-xs text-neutral-400">
        <Link href="/signin" className="hover:text-neutral-200">Back to sign in</Link>
      </div>
    </form>
  );
}
