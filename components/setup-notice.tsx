import Link from 'next/link';
import { AlertCircle, Database, ShieldCheck } from 'lucide-react';
import { SUPABASE_SETUP_MESSAGE } from '@/lib/supabase/config';

export function SetupNotice({
  title = 'Connect your Supabase project',
  compact = false,
}: {
  title?: string;
  compact?: boolean;
}) {
  return (
    <section
      className={`rounded-2xl border border-amber-200 bg-amber-50/80 shadow-xs ${
        compact ? 'p-5' : 'p-6 sm:p-8'
      }`}
      role="status"
    >
      <div className="flex items-start gap-3.5">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-amber-700 shadow-xs ring-1 ring-amber-300/50">
          <AlertCircle size={20} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-bold text-slate-900">{title}</h2>
          <p className="mt-1 max-w-2xl text-xs sm:text-sm leading-relaxed text-amber-900">
            {SUPABASE_SETUP_MESSAGE}
          </p>
          {!compact && (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-amber-200 bg-white/90 p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <ShieldCheck size={16} className="text-emerald-600" />
                  <span>Configure Public Keys</span>
                </div>
                <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                  Copy <code className="rounded bg-slate-100 px-1 py-0.5 font-mono">.env.example</code> to{' '}
                  <code className="rounded bg-slate-100 px-1 py-0.5 font-mono">.env.local</code> and provide your Supabase URL and public publishable/anon key.
                </p>
              </div>
              <div className="rounded-xl border border-amber-200 bg-white/90 p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <Database size={16} className="text-emerald-600" />
                  <span>Apply PostgreSQL Schema</span>
                </div>
                <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                  Execute the migration in <code className="rounded bg-slate-100 px-1 py-0.5 font-mono">supabase/migrations</code> to configure tables, triggers, and Row-Level Security.
                </p>
              </div>
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-4 text-xs font-semibold">
            <Link className="text-blue-600 underline underline-offset-4 hover:text-blue-700" href="/terms">
              Review Terms
            </Link>
            <a
              className="text-blue-600 underline underline-offset-4 hover:text-blue-700"
              href="https://supabase.com/docs/guides/auth"
              target="_blank"
              rel="noreferrer"
            >
              Supabase Documentation →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
