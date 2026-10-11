'use client';

import { useEffect } from 'react';
import { RefreshCw, LifeBuoy } from 'lucide-react';
import { Button, ButtonLink } from '@/components/ui/button';

/**
 * Error boundary for the workspace. It never shows a raw stack trace or a
 * database message to the user — only what they can do next.
 */
export default function WorkspaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Workspace route error', error.digest ?? '');
  }, [error]);

  return (
    <div className="mx-auto max-w-xl py-10 text-center">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl border border-danger-line bg-danger-soft text-danger">
        <RefreshCw size={20} aria-hidden="true" />
      </span>
      <h1 className="h2 mt-4">Something interrupted that request</h1>
      <p className="mx-auto mt-2 max-w-md text-[13.5px] leading-6 text-muted">
        The page could not finish loading. Your saved records are unaffected — this is a loading
        failure, not data loss. Try again, and if it keeps happening contact support.
      </p>
      <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
        <Button type="button" onClick={reset}>
          <RefreshCw size={15} aria-hidden="true" />
          Try again
        </Button>
        <ButtonLink href="/dashboard" variant="secondary">
          Back to overview
        </ButtonLink>
        <ButtonLink href="/contact" variant="ghost">
          <LifeBuoy size={15} aria-hidden="true" />
          Support
        </ButtonLink>
      </div>
      {error.digest && (
        <p className="mt-5 font-mono text-[11px] text-faint">Reference: {error.digest}</p>
      )}
    </div>
  );
}
