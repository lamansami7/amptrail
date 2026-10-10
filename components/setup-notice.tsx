import Link from 'next/link';
import { AlertCircle, Database, ShieldCheck } from 'lucide-react';
import { SUPABASE_SETUP_MESSAGE } from '@/lib/supabase/config';

export function SetupNotice({ title = 'Connect your Supabase project', compact = false }: { title?: string; compact?: boolean }) {
  return (
    <section className={`rounded-2xl border border-amber-200 bg-amber-50 ${compact ? 'p-5' : 'p-7 sm:p-9'}`} role="status">
      <div className="flex items-start gap-3.5">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-amber-700 shadow-sm">
          <AlertCircle size={20} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold text-ink">{title}</h2>
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-700">{SUPABASE_SETUP_MESSAGE}</p>
          {!compact && (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-amber-200/80 bg-white/80 p-4">
                <div className="flex items-center gap-2 text-sm font-bold"><ShieldCheck size={16} className="text-green" /> Add public environment keys</div>
                <p className="mt-1.5 text-xs leading-5 text-muted">Copy <code className="rounded bg-slate-100 px-1">.env.example</code> to <code className="rounded bg-slate-100 px-1">.env.local</code> and set your Supabase project URL and browser-safe publishable/anon key.</p>
              </div>
              <div className="rounded-xl border border-amber-200/80 bg-white/80 p-4">
                <div className="flex items-center gap-2 text-sm font-bold"><Database size={16} className="text-green" /> Apply the database setup</div>
                <p className="mt-1.5 text-xs leading-5 text-muted">Run the migration in <code className="rounded bg-slate-100 px-1">supabase/migrations</code>, then create the private evidence bucket and policies in SQL.</p>
              </div>
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-4 text-sm font-semibold">
            <Link className="text-orange-dark underline decoration-orange/40 underline-offset-4" href="/terms">Review terms</Link>
            <a className="text-orange-dark underline decoration-orange/40 underline-offset-4" href="https://supabase.com/docs/guides/auth" target="_blank" rel="noreferrer">Supabase Auth setup</a>
          </div>
        </div>
      </div>
    </section>
  );
}
