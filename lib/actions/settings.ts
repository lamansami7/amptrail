'use server';

import { revalidatePath } from 'next/cache';
import { settingsSchema } from '@/lib/schemas/settings';
import { requireWorkspace } from '@/lib/data/workspace';

export type SettingsActionState = { error?: string; success?: string };

export async function updateSettingsAction(_previous: SettingsActionState, formData: FormData): Promise<SettingsActionState> {
  const parsed = settingsSchema.safeParse({ full_name: String(formData.get('full_name') || ''), company_name: String(formData.get('company_name') || '') });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || 'Check the account details.' };

  try {
    const { supabase, user, workspace } = await requireWorkspace();
    const { error: authError } = await supabase.auth.updateUser({ data: { full_name: parsed.data.full_name } });
    if (authError) {
      console.error('Profile metadata update failed');
      return { error: 'Your profile could not be updated. Please try again.' };
    }
    const { error: profileError } = await supabase.from('profiles').update({ full_name: parsed.data.full_name }).eq('id', user.id);
    const { data: company, error: companyError } = await supabase.from('companies').update({ name: parsed.data.company_name }).eq('id', workspace.id).select('id').maybeSingle();
    if (profileError || companyError || !company) {
      console.error('Workspace settings update failed:', profileError?.code || companyError?.code);
      return { error: 'Some settings could not be saved. Refresh the page and try again.' };
    }
    revalidatePath('/settings');
    revalidatePath('/dashboard');
    return { success: 'Your workspace details have been updated.' };
  } catch {
    return { error: 'Settings could not be updated. Please try again.' };
  }
}
