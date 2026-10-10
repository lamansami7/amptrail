import type { Metadata } from 'next';
import Link from 'next/link';
import { Brand } from '@/components/brand';
import { ButtonLink } from '@/components/ui/button';
import { SignOutButton } from '@/components/workspace/sign-out-button';
import { parseWorkspaceErrorReason, workspaceErrorMessage } from '@/lib/data/workspace-status';

export const metadata: Metadata = { title: 'Workspace unavailable' };
export const dynamic = 'force-dynamic';

export default async function WorkspaceUnavailablePage({ searchParams }: { searchParams: Promise<{ reason?: string }> }) {
  const { reason } = await searchParams;
  const message = workspaceErrorMessage(parseWorkspaceErrorReason(reason));

  return <main className="min-h-screen bg-canvas px-4 py-8 sm:px-6 sm:py-12">
    <div className="mx-auto max-w-4xl">
      <header className="flex items-center justify-between gap-4">
        <Brand />
        <SignOutButton compact />
      </header>
      <section className="mt-12 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950 sm:p-8" role="status">
        <p className="text-sm font-bold uppercase tracking-[0.12em] text-amber-800">Temporary problem</p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-[-0.04em] text-ink">{message.title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-800">{message.body}</p>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <ButtonLink href="/dashboard">Try again</ButtonLink>
          <Link href="/contact" className="text-sm font-semibold text-orange-dark underline underline-offset-4">Contact the deployment owner</Link>
        </div>
      </section>
    </div>
  </main>;
}
