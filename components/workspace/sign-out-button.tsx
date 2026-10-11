'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, LoaderCircle } from 'lucide-react';
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
        setError('Sign out failed. Check connection.');
        setPending(false);
        return;
      }
      router.replace('/');
      router.refresh();
    } catch {
      setError('Sign out failed. Check connection.');
      setPending(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={signOut}
        disabled={pending}
        className="flex min-h-8 w-full items-center gap-2 rounded-lg px-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition disabled:opacity-50 cursor-pointer"
        aria-label="Sign out"
      >
        {pending ? <LoaderCircle size={14} className="animate-spin" /> : <LogOut size={14} />}
        {!compact && <span>{pending ? 'Signing out…' : 'Sign out'}</span>}
      </button>
      {error && <p className="px-2 pt-1 text-[10px] text-rose-600" role="alert">{error}</p>}
    </div>
  );
}
