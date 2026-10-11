import Link from 'next/link';
import { Database, KeyRound, LifeBuoy } from 'lucide-react';
import { SUPABASE_SETUP_MESSAGE } from '@/lib/supabase/config';
import { Alert } from '@/components/ui/alert';

/**
 * Shown when the deployment has no Supabase credentials. It explains exactly
 * what an operator has to do — it never pretends the app is working.
 */
export function SetupNotice({
  title = 'Connect your Supabase project',
  compact = false,
}: {
  title?: string;
  compact?: boolean;
}) {
  return (
    <Alert tone="warning" role="status" title={title}>
      <p className="text-[13px] leading-6">{SUPABASE_SETUP_MESSAGE}</p>

      {!compact && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-warning-line bg-surface px-4 py-3">
            <p className="flex items-center gap-2 text-[13px] font-semibold text-ink">
              <KeyRound size={14} className="text-warning" aria-hidden="true" />
              Add the public keys
            </p>
            <p className="mt-1.5 text-[12.5px] leading-5 text-muted">
              Copy <code className="rounded bg-surface-3 px-1 py-0.5 font-mono text-[11.5px]">.env.example</code>{' '}
              to <code className="rounded bg-surface-3 px-1 py-0.5 font-mono text-[11.5px]">.env.local</code> and add
              your Supabase project URL plus a browser-safe publishable (or legacy anon) key.
            </p>
          </div>
          <div className="rounded-lg border border-warning-line bg-surface px-4 py-3">
            <p className="flex items-center gap-2 text-[13px] font-semibold text-ink">
              <Database size={14} className="text-warning" aria-hidden="true" />
              Apply the schema
            </p>
            <p className="mt-1.5 text-[12.5px] leading-5 text-muted">
              Run the migration in{' '}
              <code className="rounded bg-surface-3 px-1 py-0.5 font-mono text-[11.5px]">supabase/migrations</code> to
              create the tables, triggers, row-level security policies and the private evidence bucket.
            </p>
          </div>
        </div>
      )}

      <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[12.5px]">
        <Link href="/contact" className="link inline-flex items-center gap-1.5">
          <LifeBuoy size={13} aria-hidden="true" />
          Contact support
        </Link>
        <a
          href="https://supabase.com/docs/guides/auth"
          target="_blank"
          rel="noreferrer"
          className="link"
        >
          Supabase auth documentation
        </a>
      </p>
    </Alert>
  );
}
