import Link from 'next/link';
import { ArrowLeft, Home, SearchX } from 'lucide-react';
import { Brand } from '@/components/brand';
import { ButtonLink } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md text-center">
        <div className="mb-8 flex justify-center">
          <Brand />
        </div>
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-600/10 shadow-xs">
          <SearchX size={26} />
        </span>
        <p className="eyebrow mt-5">404 · Page Not Found</p>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
          This record is off the grid.
        </h1>
        <p className="mx-auto mt-2.5 max-w-sm text-xs leading-5 text-slate-500">
          The link may have moved or the job ticket may no longer be available in this workspace.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-2.5 sm:flex-row">
          <ButtonLink href="/dashboard">
            <ArrowLeft size={15} /> Back to Dashboard
          </ButtonLink>
          <ButtonLink href="/" variant="secondary">
            <Home size={15} /> Public Site
          </ButtonLink>
        </div>
        <div className="mt-6">
          <Link
            href="/contact"
            className="text-xs font-semibold text-slate-400 hover:text-slate-600 underline underline-offset-4"
          >
            Need assistance? Contact support
          </Link>
        </div>
      </div>
    </main>
  );
}
