import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/database.types';
import { isSupabaseConfigured } from '@/lib/supabase/config';

type Workspace = { id: string; name: string; role: 'owner' | 'member' };

export async function loadWorkspaceContext() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: memberships, error: membershipError } = await supabase
    .from('company_memberships')
    .select('company_id, role')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1);

  if (membershipError || !memberships?.[0]) {
    return { supabase, user, workspace: null as Workspace | null, setupError: true };
  }

  const membership = memberships[0] as Pick<Database['public']['Tables']['company_memberships']['Row'], 'company_id' | 'role'>;
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('id, name')
    .eq('id', membership.company_id)
    .single();

  if (companyError || !company) return { supabase, user, workspace: null as Workspace | null, setupError: true };
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
