'use server';

import { revalidatePath } from 'next/cache';
import { requireWorkspace } from '@/lib/data/workspace';
import {
  attachmentSchema,
  createSubmissionSchema,
  triageSchema,
  type CreateSubmissionInput,
} from '@/lib/schemas/submission';
import {
  initialSubmissionStatus,
  resolveTriage,
  submissionStatusLabel,
  submissionExcerpt,
  type SubmissionStatus,
} from '@/lib/inbox/status';
import { z } from 'zod';

type Result<T = object> = ({ error?: undefined } & T) | { error: string };

const MIGRATION_HINT = 'Confirm the latest database migration has been applied.';

function revalidateInbox(id?: string) {
  revalidatePath('/inbox');
  revalidatePath('/activity');
  if (id) revalidatePath(`/inbox/${id}`);
}

/**
 * Log a field note. The text is stored exactly as typed and can never be edited
 * afterwards; only its triage (project, status, missing details) can change.
 */
export async function createSubmissionAction(input: CreateSubmissionInput): Promise<Result<{ id: string }>> {
  const parsed = createSubmissionSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Check the note and try again.' };
  const { senderName, body, projectId } = parsed.data;

  try {
    const { supabase, user, workspace } = await requireWorkspace();

    if (projectId) {
      const { data: project } = await supabase
        .from('projects')
        .select('id')
        .eq('id', projectId)
        .eq('company_id', workspace.id)
        .eq('is_archived', false)
        .maybeSingle();
      if (!project) return { error: 'Choose an active project from this workspace, or leave it blank.' };
    }

    const { data, error } = await supabase
      .from('field_submissions')
      .insert({
        company_id: workspace.id,
        submitted_by: user.id,
        source: 'web',
        sender_name: senderName,
        body,
        project_id: projectId,
        status: initialSubmissionStatus(projectId),
      })
      .select('id')
      .single();
    if (error || !data) {
      console.error('Submission save failed:', error?.code);
      return { error: `The note could not be saved. ${MIGRATION_HINT}` };
    }

    await supabase.from('activity_events').insert({
      company_id: workspace.id,
      actor_id: user.id,
      event_type: 'submission.created',
      entity_type: 'field_submission',
      entity_id: data.id,
      description: `Logged a field note${senderName ? ` from ${senderName}` : ''}: ${submissionExcerpt(body, 90)}`,
    });
    revalidateInbox();
    return { id: data.id };
  } catch {
    return { error: 'The note could not be saved. Please try again.' };
  }
}

/** Record a photo that the browser already uploaded to private storage. */
export async function addSubmissionAttachmentAction(input: unknown): Promise<Result> {
  const parsed = attachmentSchema.safeParse(input);
  if (!parsed.success) return { error: 'Check the photo details.' };
  const value = parsed.data;

  try {
    const { supabase, user, workspace } = await requireWorkspace();
    const parts = value.storagePath.split('/');
    const validFilename = /^[a-zA-Z0-9._-]+$/.test(parts[3] || '');
    if (
      parts.length !== 4 ||
      parts[0] !== workspace.id ||
      parts[1] !== 'inbox' ||
      parts[2] !== value.submissionId ||
      !validFilename
    ) {
      return { error: 'The uploaded file path is not valid for this submission.' };
    }

    const { error } = await supabase.from('submission_attachments').insert({
      company_id: workspace.id,
      submission_id: value.submissionId,
      uploaded_by: user.id,
      storage_path: value.storagePath,
      original_filename: value.originalFilename,
      mime_type: value.mimeType,
      size_bytes: value.sizeBytes,
    });
    if (error) {
      console.error('Submission attachment save failed:', error.code);
      return {
        error: error.message.includes('at most 10 photos')
          ? 'A submission can have at most 10 photos.'
          : 'The upload finished, but its record could not be saved. Please retry.',
      };
    }
    revalidateInbox(value.submissionId);
    return {};
  } catch {
    return { error: 'The photo could not be saved. Please try again.' };
  }
}

/** Change a submission's project, status or missing-details note. */
export async function triageSubmissionAction(input: unknown): Promise<Result> {
  const parsed = triageSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Check the triage details.' };
  const { id, projectId, status, missingDetails } = parsed.data;

  try {
    const { supabase, user, workspace } = await requireWorkspace();
    const { data: current } = await supabase
      .from('field_submissions')
      .select('id, status, project_id')
      .eq('id', id)
      .eq('company_id', workspace.id)
      .maybeSingle();
    if (!current) return { error: 'That submission could not be found.' };

    const decision = resolveTriage(current.status, {
      status: status as SubmissionStatus,
      projectId,
      missingDetails,
    });
    if (!decision.ok) return { error: decision.error };

    if (decision.projectId) {
      const { data: project } = await supabase
        .from('projects')
        .select('id')
        .eq('id', decision.projectId)
        .eq('company_id', workspace.id)
        .eq('is_archived', false)
        .maybeSingle();
      if (!project) return { error: 'Choose an active project from this workspace.' };
    }

    const { data: updated, error } = await supabase
      .from('field_submissions')
      .update({
        project_id: decision.projectId,
        status: decision.status,
        missing_details: decision.missingDetails,
      })
      .eq('id', id)
      .eq('company_id', workspace.id)
      .select('id')
      .maybeSingle();
    if (error || !updated) {
      console.error('Submission triage failed:', error?.code);
      return { error: `The change could not be saved. ${MIGRATION_HINT}` };
    }

    const statusChanged = current.status !== decision.status;
    await supabase.from('activity_events').insert({
      company_id: workspace.id,
      actor_id: user.id,
      event_type: 'submission.triaged',
      entity_type: 'field_submission',
      entity_id: id,
      description: statusChanged
        ? `Marked a field note "${submissionStatusLabel(decision.status)}"`
        : 'Updated a field note’s project assignment',
    });
    revalidateInbox(id);
    return {};
  } catch {
    return { error: 'The change could not be saved. Please try again.' };
  }
}

const linkSchema = z.object({ submissionId: z.string().uuid(), ticketId: z.string().uuid() });

/**
 * After a ticket is created from a submission, close the submission and link it.
 * Best effort by design: the ticket is already saved, so a failure here must not
 * block the person; the submission simply stays open and can be linked by hand.
 */
export async function linkSubmissionToTicket(submissionId: string, ticketId: string): Promise<boolean> {
  const parsed = linkSchema.safeParse({ submissionId, ticketId });
  if (!parsed.success) return false;
  try {
    const { supabase, user, workspace } = await requireWorkspace();
    const { data: ticket } = await supabase
      .from('work_tickets')
      .select('id, project_id, ticket_number')
      .eq('id', parsed.data.ticketId)
      .eq('company_id', workspace.id)
      .maybeSingle();
    if (!ticket) return false;

    const { data: updated, error } = await supabase
      .from('field_submissions')
      .update({ project_id: ticket.project_id, ticket_id: ticket.id, status: 'processed', missing_details: null })
      .eq('id', parsed.data.submissionId)
      .eq('company_id', workspace.id)
      .neq('status', 'processed')
      .select('id')
      .maybeSingle();
    if (error || !updated) return false;

    await supabase.from('activity_events').insert({
      company_id: workspace.id,
      actor_id: user.id,
      event_type: 'submission.processed',
      entity_type: 'field_submission',
      entity_id: parsed.data.submissionId,
      description: `Turned a field note into ${ticket.ticket_number}`,
    });
    revalidateInbox(parsed.data.submissionId);
    return true;
  } catch {
    return false;
  }
}
