import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Lock } from 'lucide-react';
import { Brand } from '@/components/brand';

const assurances = [
  'Capture extra work, crew hours and materials in one pass',
  'Attach jobsite photos before the work is covered',
  'Export a clean T&M PDF record for review',
  'Company-scoped data with row-level security in Postgres',
];

export function AuthFrame({
  children,
  eyebrow = 'Field documentation workspace',
  title,
  subtitle,
}: {
  children: React.ReactNode;
  eyebrow?: string;
  title: string;
  subtitle: string;
}) {
  return (
    <main className="min-h-dvh lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(28rem,0.82fr)]">
      <section className="flex min-h-dvh flex-col bg-surface px-5 py-6 sm:px-10 sm:py-8 lg:px-16">
        <header className="flex items-center justify-between gap-4">
          <Brand />
          <Link
            href="/"
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-[13px] font-medium text-muted transition-colors duration-150 hover:bg-surface-2 hover:text-ink"
          >
            <ArrowLeft size={14} aria-hidden="true" />
            Back to site
          </Link>
        </header>

        <div className="mx-auto flex w-full max-w-[26rem] flex-1 flex-col justify-center py-10">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="mt-3 text-[1.625rem] font-semibold leading-tight tracking-[-0.025em] text-ink">
            {title}
          </h1>
          <p className="mt-2 text-[14px] leading-6 text-muted">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>

        <footer className="mx-auto w-full max-w-[26rem] text-[12px] text-subtle">
          <Link href="/terms" className="transition-colors duration-150 hover:text-body">
            Terms
          </Link>
          <span aria-hidden="true" className="px-2">
            ·
          </span>
          <Link href="/privacy" className="transition-colors duration-150 hover:text-body">
            Privacy
          </Link>
          <span aria-hidden="true" className="px-2">
            ·
          </span>
          <Link href="/contact" className="transition-colors duration-150 hover:text-body">
            Support
          </Link>
        </footer>
      </section>

      <aside className="relative hidden flex-col justify-between overflow-hidden bg-ink px-12 py-14 text-white lg:flex xl:px-16">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(90%_70%_at_100%_0%,rgba(37,99,235,0.28),transparent_60%)]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] [background-size:52px_52px] [mask-image:radial-gradient(70%_60%_at_70%_20%,black,transparent)]"
        />

        <p className="relative text-[12px] font-medium uppercase tracking-[0.1em] text-brand-300">
          AmpTrail
        </p>

        <div className="relative max-w-md">
          <h2 className="text-[1.75rem] font-semibold leading-[1.15] tracking-[-0.025em] xl:text-[2rem]">
            Document the work.
            <br />
            <span className="text-brand-300">Protect the paper trail.</span>
          </h2>
          <ul className="mt-8 space-y-4">
            {assurances.map((item) => (
              <li key={item} className="flex items-start gap-3 text-[13.5px] leading-6 text-slate-300">
                <CheckCircle2 size={16} className="mt-1 shrink-0 text-brand-400" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative flex max-w-md items-start gap-2.5 border-t border-white/10 pt-5 text-[12px] leading-5 text-slate-400">
          <Lock size={14} className="mt-0.5 shrink-0 text-brand-300" aria-hidden="true" />
          AmpTrail is an internal tracking tool. Recorded totals and workflow statuses are not
          customer sign-off, a verified change order, or a guarantee of payment.
        </p>
      </aside>
    </main>
  );
}
