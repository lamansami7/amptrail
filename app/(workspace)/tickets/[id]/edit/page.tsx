import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { WorkspaceDataNotice } from '@/components/workspace/data-notice';
import { TicketEditor } from '@/components/tickets/ticket-editor';
import { requireWorkspace } from '@/lib/data/workspace';

export const metadata: Metadata = { title: 'Edit work ticket' };

type Props = { params: Promise<{ id: string }> };

export default async function EditTicketPage({ params }: Props) {
  const { id } = await params;
  const { supabase, user, workspace } = await requireWorkspace();

  const { data: ticket, error } = await supabase
    .from('work_tickets')
    .select('*')
    .eq('id', id)
    .eq('company_id', workspace.id)
    .maybeSingle();

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Edit work ticket" />
        <WorkspaceDataNotice />
      </div>
    );
  }
  if (!ticket) notFound();
  // Only the creator may edit; everyone else gets the read-only record.
  if (ticket.created_by !== user.id) redirect(`/tickets/${ticket.id}`);

  const [
    { data: projects, error: projectError },
    { data: labor },
    { data: materials },
    { data: costs },
  ] = await Promise.all([
    supabase
      .from('projects')
      .select('id, name, project_number')
      .eq('company_id', workspace.id)
      .eq('is_archived', false)
      .order('name'),
    supabase
      .from('labor_entries')
      .select('*')
      .eq('ticket_id', ticket.id)
      .eq('company_id', workspace.id)
      .order('created_at'),
    supabase
      .from('material_entries')
      .select('*')
      .eq('ticket_id', ticket.id)
      .eq('company_id', workspace.id)
      .order('created_at'),
    supabase
      .from('ticket_costs')
      .select('*')
      .eq('ticket_id', ticket.id)
      .eq('company_id', workspace.id)
      .order('created_at'),
  ]);

  if (projectError) {
    return (
      <div className="space-y-6">
        <PageHeader title="Edit work ticket" />
        <WorkspaceDataNotice />
      </div>
    );
  }

  // Keep the ticket's own project selectable even if it has since been archived.
  const currentProject = await supabase
    .from('projects')
    .select('id, name, project_number')
    .eq('id', ticket.project_id)
    .eq('company_id', workspace.id)
    .maybeSingle();

  const availableProjects = [...(projects ?? [])];
  if (currentProject.data && !availableProjects.some((project) => project.id === currentProject.data?.id)) {
    availableProjects.unshift(currentProject.data);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <Link
        href={`/tickets/${ticket.id}`}
        className="inline-flex min-h-9 items-center gap-1.5 rounded-lg text-[13px] font-medium text-muted transition-colors duration-150 hover:text-ink"
      >
        <ArrowLeft size={15} aria-hidden="true" />
        Back to {ticket.ticket_number}
      </Link>

      <PageHeader
        eyebrow={`Editing ${ticket.ticket_number}`}
        title="Update work ticket"
        description="Line totals and the documented total recalculate from the entries below."
      />

      <TicketEditor
        projects={availableProjects}
        ticket={ticket}
        labor={labor ?? []}
        materials={materials ?? []}
        costs={costs ?? []}
      />
    </div>
  );
}
