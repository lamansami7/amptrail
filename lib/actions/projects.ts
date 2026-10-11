'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { projectSchema } from '@/lib/schemas/project';
import { requireWorkspace } from '@/lib/data/workspace';

export type ActionState = { error?: string; success?: string };
const idSchema = z.string().uuid();

function projectValues(formData: FormData) {
  return projectSchema.safeParse({
    name: String(formData.get('name') || ''),
    project_number: String(formData.get('project_number') || ''),
    site_address: String(formData.get('site_address') || ''),
    general_contractor: String(formData.get('general_contractor') || ''),
    notes: String(formData.get('notes') || ''),
  });
}

export async function createProjectAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = projectValues(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || 'Check the project details.' };
  try {
    const { supabase, user, workspace } = await requireWorkspace();
    const { data, error } = await supabase.from('projects').insert({ company_id: workspace.id, ...parsed.data }).select('id').single();
    if (error || !data) {
      console.error('Project create failed:', error?.code);
      return { error: 'The project could not be saved. Check your connection and try again.' };
    }
    await supabase.from('activity_events').insert({ company_id: workspace.id, actor_id: user.id, event_type: 'project.created', entity_type: 'project', entity_id: data.id, description: `Created project ${parsed.data.name}` });
    revalidatePath('/projects');
    revalidatePath('/dashboard');
    redirect(`/projects/${data.id}`);
  } catch (error) {
    if (error && typeof error === 'object' && 'digest' in error) throw error;
    console.error('Project create exception');
    return { error: 'The project could not be saved. Please try again.' };
  }
}

export async function updateProjectAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const id = idSchema.safeParse(String(formData.get('id') || ''));
  if (!id.success) return { error: 'This project link is invalid.' };
  const parsed = projectValues(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || 'Check the project details.' };
  try {
    const { supabase, user, workspace } = await requireWorkspace();
    const { data, error } = await supabase.from('projects').update(parsed.data).eq('id', id.data).eq('company_id', workspace.id).select('id').maybeSingle();
    if (error || !data) {
      console.error('Project update failed:', error?.code);
      return { error: 'The project could not be updated. Check your access and try again.' };
    }
    await supabase.from('activity_events').insert({ company_id: workspace.id, actor_id: user.id, event_type: 'project.updated', entity_type: 'project', entity_id: data.id, description: `Updated project ${parsed.data.name}` });
    revalidatePath('/projects');
    revalidatePath(`/projects/${data.id}`);
    revalidatePath('/dashboard');
    redirect(`/projects/${data.id}`);
  } catch (error) {
    if (error && typeof error === 'object' && 'digest' in error) throw error;
    console.error('Project update exception');
    return { error: 'The project could not be updated. Please try again.' };
  }
}

export async function archiveProjectAction(formData: FormData) {
  const id = idSchema.safeParse(String(formData.get('id') || ''));
  const archived = String(formData.get('archived') || 'true') === 'true';
  if (!id.success) return;
  try {
    const { supabase, user, workspace } = await requireWorkspace();
    const { data, error } = await supabase.from('projects').update({ is_archived: archived }).eq('id', id.data).eq('company_id', workspace.id).select('id, name').maybeSingle();
    if (error || !data) return;
    await supabase.from('activity_events').insert({ company_id: workspace.id, actor_id: user.id, event_type: archived ? 'project.archived' : 'project.restored', entity_type: 'project', entity_id: data.id, description: `${archived ? 'Archived' : 'Restored'} project ${data.name}` });
    revalidatePath('/projects');
    revalidatePath(`/projects/${data.id}`);
    revalidatePath('/dashboard');
  } catch {
    return;
  }
}

/**
 * Archive/restore used by the confirmation dialog. Returns a result so the
 * dialog can surface a real error instead of silently doing nothing.
 */
export async function setProjectArchivedAction(
  projectId: string,
  archived: boolean
): Promise<{ error?: string }> {
  const id = idSchema.safeParse(projectId);
  if (!id.success) return { error: 'This project link is invalid.' };
  try {
    const { supabase, user, workspace } = await requireWorkspace();
    const { data, error } = await supabase
      .from('projects')
      .update({ is_archived: archived })
      .eq('id', id.data)
      .eq('company_id', workspace.id)
      .select('id, name')
      .maybeSingle();
    if (error || !data) {
      console.error('Project archive failed:', error?.code);
      return {
        error: `The project could not be ${archived ? 'archived' : 'restored'}. Check your access and try again.`,
      };
    }
    await supabase.from('activity_events').insert({
      company_id: workspace.id,
      actor_id: user.id,
      event_type: archived ? 'project.archived' : 'project.restored',
      entity_type: 'project',
      entity_id: data.id,
      description: `${archived ? 'Archived' : 'Restored'} project ${data.name}`,
    });
    revalidatePath('/projects');
    revalidatePath(`/projects/${data.id}`);
    revalidatePath('/dashboard');
    return {};
  } catch {
    return {
      error: `The project could not be ${archived ? 'archived' : 'restored'}. Please try again.`,
    };
  }
}
