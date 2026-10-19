import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/database.types';
import { isSupabaseConfigured } from '@/lib/supabase/config';

type Workspace = { id: string; name: string; role: 'owner' | 'member' };
type WorkspaceClient = Awaited<ReturnType<typeof createClient>>;
type Membership = Pick<
  Database['public']['Tables']['company_memberships']['Row'],
  'company_id' | 'role'
>;

/**
 * Self-heal for a signed-in account that has no workspace membership — for
 * example an account created before the provisioning trigger existed, or one
 * whose first request raced the trigger. Calls the database's
 * ensure_user_workspace function, which derives the user from auth.uid() (the
 * browser never names a user or company to join), provisions that user's own
 * workspace when missing, and is idempotent. Returns true only when the
 * database confirms a workspace exists afterward.
 */
export async function healWorkspaceMembership(
  supabase: WorkspaceClient,
  companyName?: string | null
): Promise<boolean> {
  const name = companyName?.trim() ? companyName.trim().slice(0, 160) : 'My company';
  try {
    const { data, error } = await supabase.rpc('ensure_user_workspace', {
      p_company_name: name,
    });
    return !error && Boolean(data);
  } catch {
    // Older databases without the function (or a transient failure) fall
    // through to the workspace-setup screen instead of crashing the request.
    return false;
  }
}

async function readMembership(supabase: WorkspaceClient, userId: string) {
  const { data, error } = await supabase
    .from('company_memberships')
    .select('company_id, role')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1);
  if (error || !data?.[0]) return null;
  return data[0] as Membership;
}

export async function loadWorkspaceContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  let membership = await readMembership(supabase, user.id);

  if (!membership) {
    const metadataName =
      typeof user.user_metadata?.company_name === 'string'
        ? user.user_metadata.company_name
        : null;
    if (await healWorkspaceMembership(supabase, metadataName)) {
      membership = await readMembership(supabase, user.id);
    }
  }

  if (!membership) {
    return { supabase, user, workspace: null as Workspace | null, setupError: true };
  }

  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('id, name')
    .eq('id', membership.company_id)
    .single();

  if (companyError || !company)
    return { supabase, user, workspace: null as Workspace | null, setupError: true };
  return {
    supabase,
    user,
    workspace: { id: company.id, name: company.name, role: membership.role } as Workspace,
    setupError: false,
  };
}

export async function requireWorkspace() {
  if (!isSupabaseConfigured()) redirect('/login?error=supabase_not_configured');
  const context = await loadWorkspaceContext();
  if (!context.workspace) redirect('/workspace-setup');
  return { supabase: context.supabase, user: context.user, workspace: context.workspace };
}
