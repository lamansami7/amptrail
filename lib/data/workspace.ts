import { redirect } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/database.types';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { classifyDatabaseError, isSignedOutAuthError, type WorkspaceErrorReason } from '@/lib/data/workspace-status';

export type Workspace = { id: string; name: string; role: 'owner' | 'member' };
type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

// The lookup has four outcomes. Only `no_workspace` means "this signed-in account has no membership".
// Database, permission, and schema failures are reported as `error` so they are never shown as a
// missing workspace.
export type WorkspaceContext =
  | { status: 'anonymous' }
  | { status: 'no_workspace'; supabase: SupabaseServerClient; user: User; suggestedName: string | null }
  | { status: 'error'; reason: WorkspaceErrorReason }
  | { status: 'ready'; supabase: SupabaseServerClient; user: User; workspace: Workspace };

export async function loadWorkspaceContext(): Promise<WorkspaceContext> {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (!user) {
    return isSignedOutAuthError(userError) ? { status: 'anonymous' } : { status: 'error', reason: 'unavailable' };
  }

  const { data: memberships, error: membershipError } = await supabase
    .from('company_memberships')
    .select('company_id, role')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1);

  if (membershipError) return { status: 'error', reason: classifyDatabaseError(membershipError) };

  const membership = memberships?.[0] as Pick<Database['public']['Tables']['company_memberships']['Row'], 'company_id' | 'role'> | undefined;
  if (!membership) {
    const metadataName = typeof user.user_metadata?.company_name === 'string' ? user.user_metadata.company_name.trim().slice(0, 160) : '';
    return { status: 'no_workspace', supabase, user, suggestedName: metadataName || null };
  }

  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('id, name')
    .eq('id', membership.company_id)
    .maybeSingle();

  if (companyError) return { status: 'error', reason: classifyDatabaseError(companyError) };
  // A membership whose company cannot be read is a data problem, not a missing workspace.
  if (!company) return { status: 'error', reason: 'unavailable' };

  return {
    status: 'ready',
    supabase,
    user,
    workspace: { id: company.id, name: company.name, role: membership.role },
  };
}

// Route guard for server components and actions. Redirects instead of rendering a misleading state.
export async function requireWorkspace() {
  if (!isSupabaseConfigured()) redirect('/login?error=supabase_not_configured');
  const context = await loadWorkspaceContext();
  if (context.status === 'anonymous') redirect('/login');
  if (context.status === 'no_workspace') redirect('/workspace-setup');
  if (context.status === 'error') redirect(`/workspace-unavailable?reason=${context.reason}`);
  return { supabase: context.supabase, user: context.user, workspace: context.workspace };
}
