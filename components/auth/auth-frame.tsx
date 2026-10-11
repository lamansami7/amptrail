import Link from 'next/link';
import { ArrowLeft, Check, ShieldCheck, Zap } from 'lucide-react';
import { Brand } from '@/components/brand';

export function AuthFrame({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <main className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(460px,0.9fr)]">
      {/* Form Left Side */}
      <section className="flex min-h-screen flex-col justify-between bg-white px-6 py-8 sm:px-12 lg:px-16 xl:px-24">
        <header className="flex items-center justify-between">
          <Brand />
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition"
          >
            <ArrowLeft size={14} /> Back to homepage
          </Link>
        </header>

        <div className="mx-auto w-full max-w-[420px] py-10">
          <span className="eyebrow">Electrical Subcontractor Workspace</span>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            {title}
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-500 leading-relaxed">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>

        <footer className="text-[11px] text-slate-400">
          AmpTrail · Field T&M Documentation & Evidence Tracking
        </footer>
      </section>

      {/* Brand Visual Right Side */}
      <aside className="relative hidden overflow-hidden bg-slate-950 px-12 py-16 text-white lg:flex lg:flex-col lg:justify-between xl:px-16">
        {/* Glow ambient background */}
        <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-blue-600/15 blur-3xl" aria-hidden="true" />
        <div className="absolute -bottom-20 -left-20 h-96 w-96 rounded-full bg-indigo-600/10 blur-3xl" aria-hidden="true" />

        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-blue-400">
            <Zap size={13} className="fill-blue-400" />
            Built for Commercial Electrical
          </span>
        </div>

        <div className="relative max-w-lg space-y-6">
          <h2 className="text-3xl font-black leading-tight tracking-tight sm:text-4xl">
            Document the work.<br />
            <span className="text-blue-500">Protect the paper trail.</span>
          </h2>
          <p className="text-sm leading-relaxed text-slate-400">
            Never let extra conduit runs, rerouted feeds, or unforeseen site obstructions slip through the cracks without verifiable records.
          </p>

          <ul className="space-y-3 pt-2 text-xs text-slate-300">
            {[
              'Mobile-friendly T&M ticket documentation in under 3 minutes',
              'Geotagged jobsite photos and field notes tied to customer projects',
              'Export audit-ready PDF records with dual signature blocks',
              'Multi-tenant PostgreSQL isolation with Row-Level Security',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-blue-500/20 text-blue-400">
                  <Check size={12} strokeWidth={3} />
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative border-t border-slate-800/80 pt-4 text-[11px] leading-relaxed text-slate-500">
          <ShieldCheck size={14} className="inline mr-1 text-blue-400" />
          AmpTrail is an internal tracking tool. Tickets document field activity and do not constitute contract approval or invoicing guarantees.
        </div>
      </aside>
    </main>
  );
}
