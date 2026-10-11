import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Brand } from '@/components/brand';
import { SiteFooter } from '@/components/marketing/site-footer';

/**
 * Shared frame for the supporting pages (contact, privacy, terms) so they match
 * the marketing site instead of looking like a separate product.
 */
export function LegalShell({
  eyebrow,
  title,
  updated,
  children,
  aside,
}: {
  eyebrow: string;
  title: string;
  updated?: string;
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-canvas">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Brand />
          <Link
            href="/"
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-[13px] font-medium text-muted transition-colors duration-150 hover:bg-surface-2 hover:text-ink"
          >
            <ArrowLeft size={14} aria-hidden="true" />
            Back to site
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="h1 mt-3">{title}</h1>
        {updated && <p className="mt-2 text-[13px] text-subtle">Last updated {updated}</p>}

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_16rem] lg:items-start">
          <div className="space-y-6 rounded-2xl border border-line bg-surface p-6 shadow-sm sm:p-8">
            {children}
          </div>
          {aside && <aside className="space-y-4">{aside}</aside>}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

export function LegalSection({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-[1.0625rem] font-semibold tracking-[-0.012em] text-ink">{heading}</h2>
      <div className="mt-2 space-y-2 text-[14px] leading-7 text-body">{children}</div>
    </section>
  );
}
