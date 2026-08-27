import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { FieldError, inputClass, buttonClass } from './AuthShell';

export function SignUpForm() {
  const router = useRouter();
  const [step, setStep] = useState<'details' | 'code'>('details');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function start(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const f = new FormData(e.currentTarget);
    const r = await fetch('/api/auth/signup/start', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        orgName: f.get('orgName'), name: f.get('name'),
        email: f.get('email'), password: f.get('password'),
      }),
    });
    setBusy(false);
    if (!r.ok) {
      setError((await r.json().catch(() => ({}))).error ?? 'Sign up failed');
      return;
    }
    setEmail(String(f.get('email')));
    setNotice('We sent a 6-digit code to your email.');
    setStep('code');
  }

  async function verify(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const f = new FormData(e.currentTarget);
    const r = await fetch('/api/auth/signup/verify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, code: f.get('code') }),
    });
    if (!r.ok) {
      setBusy(false);
      setError((await r.json().catch(() => ({}))).error ?? 'Verification failed');
      return;
    }
    router.replace('/');
  }

  if (step === 'code') {
    return (
      <form onSubmit={verify} className="space-y-3">
        <p className="text-xs text-neutral-400">{notice} Code sent to {email}</p>
        <input name="code" inputMode="numeric" pattern="\d{6}" maxLength={6} required
          placeholder="6-digit code" className={`${inputClass} tracking-[0.4em]`} />
        <FieldError message={error} />
        <button disabled={busy} className={buttonClass}>{busy ? 'Verifying…' : 'Verify & continue'}</button>
        <button type="button" onClick={() => { setStep('details'); setError(null); }}
          className="w-full text-xs text-neutral-400 hover:text-neutral-200">← Back</button>
      </form>
    );
  }

  return (
    <form onSubmit={start} className="space-y-3">
      <input name="orgName" required placeholder="Organization name" className={inputClass} />
      <input name="name" required placeholder="Your name" autoComplete="name" className={inputClass} />
      <input name="email" type="email" required placeholder="Email" autoComplete="email" className={inputClass} />
      <input name="password" type="password" required minLength={8} placeholder="Password (min 8)"
        autoComplete="new-password" className={inputClass} />
      <FieldError message={error} />
      <button disabled={busy} className={buttonClass}>{busy ? 'Sending code…' : 'Create account'}</button>
      <div className="text-xs text-neutral-400">
        <Link href="/signin" className="hover:text-neutral-200">Already have an account?</Link>
      </div>
    </form>
  );
}
