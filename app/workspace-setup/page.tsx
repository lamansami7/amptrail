import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Brand } from '@/components/brand';
import { SignOutButton } from '@/components/workspace/sign-out-button';
import { WorkspaceSetupForm } from '@/components/workspace/workspace-setup-form';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { loadWorkspaceContext } from '@/lib/data/workspace';

export const metadata: Metadata = { title: 'Set up your workspace' };
export const dynamic = 'force-dynamic';

export default async function WorkspaceSetupPage() {
  if (!isSupabaseConfigured()) redirect('/login?error=supabase_not_configured');

  const context = await loadWorkspaceContext();
  if (context.status === 'anonymous') redirect('/login');
  if (context.status === 'error') redirect(`/workspace-unavailable?reason=${context.reason}`);
  if (context.status === 'ready') redirect('/dashboard');

  return <main className="min-h-screen bg-canvas px-4 py-8 sm:px-6 sm:py-12">
    <div className="mx-auto max-w-4xl">
      <header className="flex items-center justify-between gap-4">
        <Brand />
        <SignOutButton compact />
      </header>
      <section className="mt-12 rounded-2xl border border-line bg-white p-5 shadow-card sm:p-8">
        <p className="eyebrow">Account connected</p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-[-0.04em] text-ink">Name your company to open your workspace</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
          Your account is confirmed, but it does not have a company workspace yet. Create one now. Your workspace is private to your account, and no data from other companies is shown or attached.
        </p>
        <div className="mt-6 max-w-md">
          <WorkspaceSetupForm defaultCompanyName={context.suggestedName} />
        </div>
      </section>
    </div>
  </main>;
}
