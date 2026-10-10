import { redirect } from 'next/navigation';
import { SetupNotice } from '@/components/setup-notice';
import { WorkspaceShell } from '@/components/workspace/workspace-shell';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { loadWorkspaceContext } from '@/lib/data/workspace';

export const dynamic = 'force-dynamic';

export default async function WorkspaceLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  if (!isSupabaseConfigured()) {
    return <main className="min-h-screen bg-canvas px-4 py-8 sm:px-8 sm:py-12"><div className="mx-auto max-w-4xl"><SetupNotice title="Workspace setup needed" /></div></main>;
  }

  const context = await loadWorkspaceContext();
  if (!context.user) redirect('/login');
  if (!context.workspace) redirect('/workspace-setup');

  return <WorkspaceShell email={context.user.email || ''} fullName={context.user.user_metadata?.full_name || null} companyName={context.workspace.name}>{children}</WorkspaceShell>;
}
