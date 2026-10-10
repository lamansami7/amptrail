'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export function SignOutButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  async function signOut() {
    setPending(true);
    setError('');
    try {
      const { error: signOutError } = await createClient().auth.signOut();
      if (signOutError) {
        setError('Sign out failed. Check your connection and try again.');
        setPending(false);
        return;
      }
      router.replace('/');
      router.refresh();
    } catch {
      setError('Sign out failed. Check your connection and try again.');
      setPending(false);
    }
  }

  return <div>
    <button type="button" onClick={signOut} disabled={pending} className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-muted transition hover:bg-slate-100 hover:text-ink disabled:opacity-50" aria-label="Sign out">
      <LogOut size={17} aria-hidden="true" />
      {!compact && <span>{pending ? 'Signing out…' : 'Sign out'}</span>}
    </button>
    {error && <p className="px-3 text-[11px] leading-4 text-red-700" role="alert">{error}</p>}
  </div>;
}
