import { redirect } from 'next/navigation';
import { SetupNotice } from '@/components/setup-notice';
import { WorkspaceShell } from '@/components/workspace/workspace-shell';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { loadWorkspaceContext } from '@/lib/data/workspace';

export const dynamic = 'force-dynamic';

export default async function WorkspaceLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  if (!isSupabaseConfigured()) {
    return (
      <main className="min-h-dvh px-4 py-10 sm:px-8 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <SetupNotice title="Connect a Supabase project to open the workspace" />
        </div>
      </main>
    );
  }

  const context = await loadWorkspaceContext();
  if (!context.user) redirect('/login');
  if (!context.workspace) redirect('/workspace-setup');

  return (
    <WorkspaceShell
      email={context.user.email || ''}
      fullName={context.user.user_metadata?.full_name || null}
      companyName={context.workspace.name}
      role={context.workspace.role}
    >
      {children}
    </WorkspaceShell>
  );
}
