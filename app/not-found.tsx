import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, FileQuestion, Home } from 'lucide-react';
import { Brand } from '@/components/brand';
import { ButtonLink } from '@/components/ui/button';
import { SUPPORT_EMAIL, supportMailto } from '@/lib/support';

export const metadata: Metadata = { title: 'Not found' };

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-4 py-12">
      <div className="w-full max-w-md text-center">
        <div className="mb-8 flex justify-center">
          <Brand />
        </div>

        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-brand-line bg-brand-soft text-brand-600">
          <FileQuestion size={26} aria-hidden="true" />
        </span>

        <p className="eyebrow mt-6">404 · Not found</p>
        <h1 className="h2 mt-2 text-balance">We could not find that page</h1>
        <p className="mx-auto mt-2.5 max-w-sm text-[13.5px] leading-6 text-muted">
          The link may have changed, or the record may be in a different workspace or no longer
          shared with you.
        </p>

        <div className="mt-7 flex flex-col justify-center gap-2.5 sm:flex-row">
          <ButtonLink href="/dashboard">
            <ArrowLeft size={15} aria-hidden="true" />
            Back to overview
          </ButtonLink>
          <ButtonLink href="/" variant="secondary">
            <Home size={15} aria-hidden="true" />
            Go to the homepage
          </ButtonLink>
        </div>

        <p className="mt-6 text-[12.5px] text-subtle">
          Need a hand?{' '}
          <Link href="/contact" className="link">
            Contact support
          </Link>{' '}
          or email{' '}
          <a href={supportMailto({ subject: 'Page not found' })} className="link">
            {SUPPORT_EMAIL}
          </a>
          .
        </p>
      </div>
    </main>
  );
}
