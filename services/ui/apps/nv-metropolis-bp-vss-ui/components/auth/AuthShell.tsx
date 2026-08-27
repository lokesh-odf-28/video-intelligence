import Head from 'next/head';
import type { ReactNode } from 'react';
import { APPLICATION_TITLE } from '../../constants/constants';

export function AuthShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <>
      <Head><title>{title} · {APPLICATION_TITLE}</title></Head>
      <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-neutral-100 p-4">
        <div className="w-full max-w-sm space-y-6 rounded-lg border border-neutral-800 bg-neutral-900 p-6">
          <div className="space-y-1">
            <div className="text-xs uppercase tracking-widest text-neutral-500">{APPLICATION_TITLE}</div>
            <h1 className="text-lg font-semibold">{title}</h1>
          </div>
          {children}
        </div>
      </div>
    </>
  );
}

export function FieldError({ message }: { message: string | null }) {
  if (!message) return null;
  return <p className="text-sm text-red-400" role="alert">{message}</p>;
}

const inputClass = 'w-full rounded bg-neutral-800 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-green-600';
const buttonClass = 'w-full rounded bg-green-600 px-3 py-2 text-sm font-medium hover:bg-green-500 disabled:opacity-50';
export { inputClass, buttonClass };
