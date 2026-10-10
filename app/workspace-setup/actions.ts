'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { COMPANY_NAME_MAX_LENGTH } from '@/lib/auth/rules';

export type WorkspaceSetupState = { error?: string };

// Creates the signed-in user's own workspace when the account has none (recovery path).
// The browser supplies only a company name. The database routine acts on auth.uid(), never on a
// user, company, or role id from the form, and it never attaches the user to an existing company.
export async function createWorkspaceAction(_previous: WorkspaceSetupState, formData: FormData): Promise<WorkspaceSetupState> {
  if (!isSupabaseConfigured()) return { error: 'Connect Supabase before setting up a workspace.' };

  const companyName = String(formData.get('company_name') || '').trim();
  if (!companyName) return { error: 'Enter your company name to create your workspace.' };
  if (companyName.length > COMPANY_NAME_MAX_LENGTH) return { error: `Company name must be ${COMPANY_NAME_MAX_LENGTH} characters or fewer.` };

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (!user || userError) return { error: 'Your session has ended. Log in again to continue.' };

  const { data: workspaceId, error } = await supabase.rpc('ensure_user_workspace', { p_company_name: companyName });
  if (error) {
    console.error('Workspace setup failed:', error.code);
    if (error.code === '42883' || error.code === 'PGRST202') {
      return { error: 'Workspace setup is not installed on this database yet. Ask the project administrator to apply the AmpTrail provisioning migration.' };
    }
    if (error.code === '42501') return { error: 'Your session could not be verified. Log in again and retry.' };
    return { error: 'We could not create your workspace. Please try again.' };
  }
  if (!workspaceId) return { error: 'We could not create your workspace. Please try again.' };

  redirect('/dashboard');
}
