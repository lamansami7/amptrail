'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireWorkspace } from '@/lib/data/workspace';

const addEvidenceSchema = z.object({
  projectId: z.string().uuid(),
  ticketId: z.string().uuid().nullable(),
  storagePath: z.string().min(1).max(600),
  originalFilename: z.string().trim().min(1).max(255),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  sizeBytes: z.number().int().positive().max(10 * 1024 * 1024),
  caption: z.string().trim().max(240),
  notes: z.string().trim().max(3000),
});
const idSchema = z.string().uuid();

export async function addEvidenceAction(input: unknown): Promise<{ error?: string }> {
  const parsed = addEvidenceSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || 'Check the evidence details.' };

  try {
    const { supabase, user, workspace } = await requireWorkspace();
    const value = parsed.data;
    const parts = value.storagePath.split('/');
    const validFilename = /^[a-zA-Z0-9._-]+$/.test(parts[3] || '');
    if (parts.length !== 4 || parts[0] !== workspace.id || parts[1] !== value.projectId || parts[2] !== (value.ticketId || 'project') || !validFilename) {
      return { error: 'The uploaded file path is not valid for this project.' };
    }

    const { error } = await supabase.from('evidence_files').insert({
      company_id: workspace.id,
      project_id: value.projectId,
      ticket_id: value.ticketId,
      uploaded_by: user.id,
      storage_path: value.storagePath,
      original_filename: value.originalFilename,
      mime_type: value.mimeType,
      size_bytes: value.sizeBytes,
      caption: value.caption || null,
      notes: value.notes || null,
    });
    if (error) {
      console.error('Evidence metadata save failed:', error.code);
      return { error: 'The upload finished, but its record could not be saved. Please retry.' };
    }
    if (value.ticketId) revalidatePath(`/tickets/${value.ticketId}`);
    revalidatePath('/evidence');
    return {};
  } catch {
    return { error: 'Evidence could not be saved. Please try again.' };
  }
}

export async function deleteEvidenceAction(evidenceId: string): Promise<{ error?: string }> {
  const parsed = idSchema.safeParse(evidenceId);
  if (!parsed.success) return { error: 'This evidence record is invalid.' };
  try {
    const { supabase, workspace } = await requireWorkspace();
    const { data: evidence, error: readError } = await supabase.from('evidence_files').select('id, storage_path, ticket_id').eq('id', parsed.data).eq('company_id', workspace.id).maybeSingle();
    if (readError || !evidence) return { error: 'This evidence is unavailable or you do not have access to remove it.' };
    const { error: storageError } = await supabase.storage.from('evidence').remove([evidence.storage_path]);
    if (storageError) {
      console.error('Evidence object removal failed:', storageError.name);
      return { error: 'The private photo could not be removed. Please try again.' };
    }
    const { error: deleteError } = await supabase.from('evidence_files').delete().eq('id', evidence.id).eq('company_id', workspace.id);
    if (deleteError) return { error: 'The evidence record could not be removed.' };
    if (evidence.ticket_id) revalidatePath(`/tickets/${evidence.ticket_id}`);
    revalidatePath('/evidence');
    return {};
  } catch {
    return { error: 'Evidence could not be removed. Please try again.' };
  }
}
