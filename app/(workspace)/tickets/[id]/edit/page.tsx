import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { PageHeader, DataSetupMessage } from '@/components/workspace/app-page';
import { TicketEditor } from '@/components/tickets/ticket-editor';
import { requireWorkspace } from '@/lib/data/workspace';

export const metadata: Metadata = { title: 'Edit work ticket' };
type Props = { params: Promise<{ id: string }> };

export default async function EditTicketPage({ params }: Props) {
  const { id } = await params;
  const { supabase, user, workspace } = await requireWorkspace();
  const { data: ticket, error } = await supabase.from('work_tickets').select('*').eq('id', id).eq('company_id', workspace.id).maybeSingle();
  if (error) return <><PageHeader title="Edit work ticket" /><DataSetupMessage /></>;
  if (!ticket) notFound();
  if (ticket.created_by !== user.id) redirect(`/tickets/${ticket.id}`);
  const [{ data: projects, error: projectError }, { data: labor }, { data: materials }, { data: costs }] = await Promise.all([
    supabase.from('projects').select('id, name, project_number').eq('company_id', workspace.id).eq('is_archived', false).order('name'),
    supabase.from('labor_entries').select('*').eq('ticket_id', ticket.id).eq('company_id', workspace.id).order('created_at'),
    supabase.from('material_entries').select('*').eq('ticket_id', ticket.id).eq('company_id', workspace.id).order('created_at'),
    supabase.from('ticket_costs').select('*').eq('ticket_id', ticket.id).eq('company_id', workspace.id).order('created_at'),
  ]);
  if (projectError) return <><PageHeader title="Edit work ticket" /><DataSetupMessage /></>;
  const currentProject = await supabase.from('projects').select('id, name, project_number').eq('id', ticket.project_id).eq('company_id', workspace.id).maybeSingle();
  const availableProjects = [...(projects || [])];
  if (currentProject.data && !availableProjects.some((project) => project.id === currentProject.data?.id)) availableProjects.unshift(currentProject.data);

  return <div className="mx-auto max-w-4xl"><PageHeader eyebrow={ticket.ticket_number} title="Edit work ticket" description="Update the record. Amounts are recalculated from the line items." /><TicketEditor projects={availableProjects} ticket={ticket} labor={labor || []} materials={materials || []} costs={costs || []} /></div>;
}
