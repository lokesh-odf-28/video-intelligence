import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { AuthShell } from '../components/auth/AuthShell';

/**
 * No logout button exists in the stock VSS UI yet. Until the header is
 * customized, visiting /signout clears the session and returns to sign-in.
 */
export default function SignOutPage() {
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/logout', { method: 'POST' })
      .catch(() => {})
      .finally(() => router.replace('/signin'));
  }, [router]);

  return <AuthShell title="Signing out…"><p className="text-sm text-neutral-400">One moment.</p></AuthShell>;
}
