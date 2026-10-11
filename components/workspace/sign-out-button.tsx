'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/** Shared sign-out behaviour so the sidebar, drawer and settings agree. */
export function useSignOut() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  const signOut = useCallback(async () => {
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
  }, [router]);

  return { signOut, pending, error };
}

export function SignOutButton({
  variant = 'secondary',
  size = 'sm',
  className,
  label = 'Sign out',
  compact = false,
}: {
  variant?: 'secondary' | 'ghost' | 'dangerSoft' | 'primary';
  size?: 'sm' | 'md';
  className?: string;
  label?: string;
  /** Icon-only presentation for tight toolbars. */
  compact?: boolean;
}) {
  const { signOut, pending, error } = useSignOut();

  return (
    <div className={className}>
      <Button
        type="button"
        variant={variant}
        size={size}
        iconOnly={compact}
        onClick={signOut}
        loading={pending}
        aria-label={compact ? label : undefined}
        title={compact ? label : undefined}
        className={compact ? className : cn('w-full sm:w-auto', className)}
      >
        {!pending && <LogOut size={15} aria-hidden="true" />}
        {!compact && (pending ? 'Signing out…' : label)}
      </Button>
      {error && (
        <p role="alert" className="mt-2 text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
