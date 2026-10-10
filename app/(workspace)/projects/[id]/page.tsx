import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CalendarDays, ClipboardList, Edit3, MapPin, Plus, Tag } from 'lucide-react';
import { requireWorkspace } from '@/lib/data/workspace';
import { formatDate, formatStatus } from '@/lib/utils';
import { PageHeader, DataSetupMessage, EmptyState } from '@/components/workspace/app-page';
import { ButtonLink } from '@/components/ui/button';
import { StatusBadge } from '@/components/workspace/status-badge';
import { ConfirmActionForm } from '@/components/forms/confirm-action-form';
import { archiveProjectAction } from '@/lib/actions/projects';

export const metadata: Metadata = { title: 'Project details' };

type Props = { params: Promise<{ id: string }> };

export default async function ProjectDetailPage({ params }: Props) {
  const { id } = await params;
  const { supabase, workspace } = await requireWorkspace();
  const { data: project, error } = await supabase.from('projects').select('*').eq('id', id).eq('company_id', workspace.id).maybeSingle();
  if (error) return <DataSetupMessage />;
  if (!project) notFound();
  const { data: tickets, error: ticketsError } = await supabase.from('work_tickets').select('id, ticket_number, description, status, occurred_at, updated_at').eq('project_id', project.id).eq('company_id', workspace.id).order('occurred_at', { ascending: false }).limit(50);
  if (ticketsError) return <><PageHeader title={project.name} /><DataSetupMessage /></>;

  return <>
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><Link href="/projects" className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-muted hover:text-ink"><ArrowLeft size={16} />Projects</Link><div className="flex flex-wrap gap-2"><ButtonLink href={`/projects/${project.id}/edit`} variant="secondary"><Edit3 size={15} />Edit project</ButtonLink>{!project.is_archived && <ButtonLink href={`/tickets/new?projectId=${project.id}`}><Plus size={16} />Create work ticket</ButtonLink>}</div></div>
    <div className="mb-8 rounded-2xl border border-line bg-white p-5 shadow-card sm:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="eyebrow">Project details</p><h1 className="mt-2 text-3xl font-extrabold tracking-[-0.05em] text-ink">{project.name}</h1>{project.project_number && <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-muted"><Tag size={15} />{project.project_number}</p>}</div>{project.is_archived ? <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">Archived</span> : <span className="rounded-full bg-green/10 px-3 py-1.5 text-xs font-bold text-green">Active project</span>}</div>
      <div className="mt-6 grid gap-4 border-t border-line pt-5 sm:grid-cols-2 lg:grid-cols-3">
        <div><p className="text-xs font-semibold text-muted">Jobsite address</p><p className="mt-1 inline-flex items-start gap-1.5 text-sm font-medium text-ink"><MapPin size={15} className="mt-0.5 shrink-0 text-orange" />{project.site_address || 'Not added yet'}</p></div>
        <div><p className="text-xs font-semibold text-muted">General contractor</p><p className="mt-1 text-sm font-medium text-ink">{project.general_contractor || 'Not added yet'}</p></div>
        <div><p className="text-xs font-semibold text-muted">Created</p><p className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-ink"><CalendarDays size={15} className="text-orange" />{formatDate(project.created_at)}</p></div>
      </div>
      {project.notes && <div className="mt-5 rounded-xl bg-canvas p-4"><p className="text-xs font-semibold text-muted">Project notes</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-ink">{project.notes}</p></div>}
      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-line pt-4">
        <ConfirmActionForm action={archiveProjectAction} id={project.id} extra={{ archived: project.is_archived ? 'false' : 'true' }} label={project.is_archived ? 'Restore project' : 'Archive project'} message={project.is_archived ? 'Restore this project so it appears with active work?' : 'Archive this project? Existing tickets will remain available, but no new tickets can be created until it is restored.'} variant="quiet" />
        <p className="text-xs text-muted">{tickets?.length || 0} work ticket{tickets?.length === 1 ? '' : 's'}{tickets && tickets.length === 50 ? ' shown (most recent)' : ''}</p>
      </div>
    </div>

    <section>
      <div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="text-lg font-bold text-ink">Work tickets</h2><p className="mt-1 text-sm text-muted">Records associated with this project.</p></div>{!project.is_archived && <ButtonLink href={`/tickets/new?projectId=${project.id}`} variant="secondary"><Plus size={15} />New ticket</ButtonLink>}</div>
      {!tickets?.length ? <EmptyState icon={<ClipboardList size={22} />} title="No tickets yet" description="When extra work comes up, create a ticket here to keep the record tied to this job." action={!project.is_archived ? <ButtonLink href={`/tickets/new?projectId=${project.id}`}><Plus size={16} />Create a work ticket</ButtonLink> : undefined} /> : <div className="divide-y divide-line rounded-2xl border border-line bg-white">{tickets.map((ticket) => <Link key={ticket.id} href={`/tickets/${ticket.id}`} className="flex flex-col gap-3 p-4 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between sm:px-5"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="font-mono text-xs font-bold text-orange-dark">{ticket.ticket_number}</span><span className="text-xs text-muted">{formatDate(ticket.occurred_at)}</span></div><p className="mt-1 truncate text-sm font-semibold text-ink">{ticket.description}</p></div><div className="flex items-center justify-between gap-3"><StatusBadge status={ticket.status} /><span className="sr-only">{formatStatus(ticket.status)}</span></div></Link>)}</div>}
    </section>
  </>;
}
