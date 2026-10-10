'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { requireWorkspace } from '@/lib/data/workspace';
import { parseTicketFormData } from '@/lib/tickets/validation';
import type { Json } from '@/lib/supabase/database.types';
import { formatStatus } from '@/lib/utils';

export type TicketActionState = { error?: string };
const idSchema = z.string().uuid();

export async function saveTicketAction(_previous: TicketActionState, formData: FormData): Promise<TicketActionState> {
  const parsed = parseTicketFormData(formData);
  if (!parsed.success) return { error: parsed.message };
  const idValue = String(formData.get('id') || '').trim();
  const ticketId = idValue ? idSchema.safeParse(idValue) : null;
  if (idValue && !ticketId?.success) return { error: 'This ticket link is invalid.' };

  try {
    const { supabase, user, workspace } = await requireWorkspace();
    const { data: previous } = ticketId?.success
      ? await supabase.from('work_tickets').select('status, ticket_number').eq('id', ticketId.data).eq('company_id', workspace.id).maybeSingle()
      : { data: null };

    const { data: savedId, error } = await supabase.rpc('save_work_ticket', {
      p_ticket_id: ticketId?.success ? ticketId.data : null,
      p_project_id: parsed.data.project_id,
      p_occurred_at: parsed.data.occurred_at,
      p_location: parsed.data.location,
      p_description: parsed.data.description,
      p_out_of_scope_reason: parsed.data.out_of_scope_reason,
      p_status: parsed.data.status,
      p_gc_representative: parsed.data.gc_representative,
      p_notes: parsed.data.notes,
      p_labor: parsed.data.labor as unknown as Json,
      p_materials: parsed.data.materials as unknown as Json,
      p_costs: parsed.data.costs as unknown as Json,
    });
    if (error || !savedId) {
      console.error('Ticket save failed:', error?.code);
      return { error: 'The ticket could not be saved. Confirm that the project is active and that your database migration is current.' };
    }

    const { data: savedTicket } = await supabase.from('work_tickets').select('ticket_number').eq('id', savedId).eq('company_id', workspace.id).maybeSingle();
    const label = savedTicket?.ticket_number || 'work ticket';
    const eventType = ticketId?.success ? 'ticket.updated' : 'ticket.created';
    const statusChanged = previous && previous.status !== parsed.data.status;
    const description = ticketId?.success
      ? statusChanged ? `Updated ${label}; tracking status set to ${formatStatus(parsed.data.status)}` : `Updated ${label}`
      : `Created ${label}`;
    await supabase.from('activity_events').insert({ company_id: workspace.id, actor_id: user.id, event_type: eventType, entity_type: 'work_ticket', entity_id: savedId, description });

    revalidatePath('/tickets');
    revalidatePath('/dashboard');
    revalidatePath('/evidence');
    revalidatePath(`/tickets/${savedId}`);
    redirect(`/tickets/${savedId}`);
  } catch (error) {
    if (error && typeof error === 'object' && 'digest' in error) throw error;
    console.error('Ticket save exception');
    return { error: 'The ticket could not be saved. Please try again.' };
  }
}

export async function deleteDraftTicketAction(ticketId: string): Promise<{ error?: string }> {
  const parsedId = idSchema.safeParse(ticketId);
  if (!parsedId.success) return { error: 'This ticket link is invalid.' };
  try {
    const { supabase, user, workspace } = await requireWorkspace();
    const { data: ticket, error: ticketError } = await supabase.from('work_tickets').select('id, status, created_by').eq('id', parsedId.data).eq('company_id', workspace.id).maybeSingle();
    if (ticketError || !ticket || ticket.created_by !== user.id || ticket.status !== 'draft') {
      return { error: 'Only your own draft tickets can be deleted.' };
    }
    const { data: attachments, error: evidenceError } = await supabase.from('evidence_files').select('storage_path').eq('ticket_id', ticket.id).eq('company_id', workspace.id);
    if (evidenceError) return { error: 'The ticket evidence could not be checked. Please retry.' };
    const paths = (attachments || []).map((item) => item.storage_path);
    for (let index = 0; index < paths.length; index += 100) {
      const { error: storageError } = await supabase.storage.from('evidence').remove(paths.slice(index, index + 100));
      if (storageError) {
        console.error('Draft ticket evidence cleanup failed:', storageError.name);
        return { error: 'Some attached evidence could not be removed. The ticket was kept; try again or ask a workspace administrator for help.' };
      }
    }
    const { data, error } = await supabase.from('work_tickets').delete().eq('id', parsedId.data).eq('company_id', workspace.id).eq('status', 'draft').select('id').maybeSingle();
    if (error || !data) return { error: 'The draft could not be deleted. Refresh and try again.' };
    revalidatePath('/tickets');
    revalidatePath('/dashboard');
    revalidatePath('/evidence');
    return {};
  } catch {
    return { error: 'The draft could not be deleted. Please try again.' };
  }
}

export async function duplicateTicketAction(formData: FormData) {
  const parsedId = idSchema.safeParse(String(formData.get('id') || ''));
  if (!parsedId.success) return;
  try {
    const { supabase, user, workspace } = await requireWorkspace();
    const { data: ticket } = await supabase.from('work_tickets').select('*').eq('id', parsedId.data).eq('company_id', workspace.id).maybeSingle();
    if (!ticket) return;
    const [laborResult, materialResult, costResult] = await Promise.all([
      supabase.from('labor_entries').select('worker_name, hours, rate').eq('ticket_id', ticket.id).eq('company_id', workspace.id).order('created_at'),
      supabase.from('material_entries').select('description, quantity, unit_cost').eq('ticket_id', ticket.id).eq('company_id', workspace.id).order('created_at'),
      supabase.from('ticket_costs').select('description, quantity, unit_cost').eq('ticket_id', ticket.id).eq('company_id', workspace.id).order('created_at'),
    ]);
    if (laborResult.error || materialResult.error || costResult.error) return;
    const { data: newId, error } = await supabase.rpc('save_work_ticket', {
      p_ticket_id: null,
      p_project_id: ticket.project_id,
      p_occurred_at: ticket.occurred_at,
      p_location: ticket.location,
      p_description: ticket.description,
      p_out_of_scope_reason: ticket.out_of_scope_reason,
      p_status: 'draft',
      p_gc_representative: ticket.gc_representative,
      p_notes: ticket.notes,
      p_labor: (laborResult.data || []) as unknown as Json,
      p_materials: (materialResult.data || []) as unknown as Json,
      p_costs: (costResult.data || []) as unknown as Json,
    });
    if (error || !newId) {
      console.error('Ticket duplicate failed:', error?.code);
      return;
    }
    await supabase.from('activity_events').insert({ company_id: workspace.id, actor_id: user.id, event_type: 'ticket.duplicated', entity_type: 'work_ticket', entity_id: newId, description: `Duplicated ${ticket.ticket_number}` });
    revalidatePath('/tickets');
    revalidatePath('/dashboard');
    redirect(`/tickets/${newId}/edit`);
  } catch (error) {
    if (error && typeof error === 'object' && 'digest' in error) throw error;
  }
}
