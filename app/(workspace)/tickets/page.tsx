import type { Metadata } from 'next';
import Link from 'next/link';
import { ClipboardList, Plus, Search } from 'lucide-react';
import { requireWorkspace } from '@/lib/data/workspace';
import { PageHeader, DataSetupMessage, EmptyState } from '@/components/workspace/app-page';
import { ButtonLink } from '@/components/ui/button';
import { StatusBadge } from '@/components/workspace/status-badge';
import { formatDate, formatCurrency, formatStatus } from '@/lib/utils';
import { calculateTicketTotals } from '@/lib/tickets/totals';
import { ticketStatusOptions } from '@/lib/tickets/status';

export const metadata: Metadata = { title: 'Work tickets' };
type Props = { searchParams: Promise<{ status?: string; q?: string }> };

export default async function TicketsPage({ searchParams }: Props) {
  const params = await searchParams;
  const { supabase, workspace } = await requireWorkspace();
  const validStatus = ticketStatusOptions.find((status) => status.value === params.status)?.value;
  let query = supabase.from('work_tickets').select('id, project_id, created_by, ticket_number, description, status, occurred_at, updated_at').eq('company_id', workspace.id).order('occurred_at', { ascending: false }).limit(100);
  if (validStatus) query = query.eq('status', validStatus);
  const { data: tickets, error } = await query;
  if (error) return <><PageHeader title="Work tickets" description="Document extra work while the details are fresh." /><DataSetupMessage /></>;

  const [{ data: projects, error: projectError }, { data: labor }, { data: materials }, { data: costs }] = await Promise.all([
    supabase.from('projects').select('id, name, project_number, is_archived').eq('company_id', workspace.id).order('name'),
    tickets?.length ? supabase.from('labor_entries').select('ticket_id, hours, rate').eq('company_id', workspace.id).in('ticket_id', tickets.map((ticket) => ticket.id)) : Promise.resolve({ data: [], error: null }),
    tickets?.length ? supabase.from('material_entries').select('ticket_id, quantity, unit_cost').eq('company_id', workspace.id).in('ticket_id', tickets.map((ticket) => ticket.id)) : Promise.resolve({ data: [], error: null }),
    tickets?.length ? supabase.from('ticket_costs').select('ticket_id, quantity, unit_cost').eq('company_id', workspace.id).in('ticket_id', tickets.map((ticket) => ticket.id)) : Promise.resolve({ data: [], error: null }),
  ]);
  if (projectError) return <><PageHeader title="Work tickets" /><DataSetupMessage /></>;
  const projectMap = new Map((projects || []).map((project) => [project.id, project]));
  const totals = new Map<string, number>();
  for (const ticket of tickets || []) {
    totals.set(ticket.id, calculateTicketTotals({
      labor: (labor || []).filter((entry) => entry.ticket_id === ticket.id),
      materials: (materials || []).filter((entry) => entry.ticket_id === ticket.id),
      costs: (costs || []).filter((entry) => entry.ticket_id === ticket.id),
    }).total);
  }
  const search = (params.q || '').trim().toLowerCase();
  const filtered = (tickets || []).filter((ticket) => {
    const project = projectMap.get(ticket.project_id);
    return !search || ticket.ticket_number.toLowerCase().includes(search) || ticket.description.toLowerCase().includes(search) || (project?.name || '').toLowerCase().includes(search);
  });
  const firstActiveProject = projects?.find((project) => !project.is_archived)?.id;
  const statusHref = (status?: string) => status ? `/tickets?status=${status}${params.q ? `&q=${encodeURIComponent(params.q)}` : ''}` : `/tickets${params.q ? `?q=${encodeURIComponent(params.q)}` : ''}`;

  return <>
    <PageHeader eyebrow="Field records" title="Work tickets" description="A clear history of extra work, with the details that help explain it." action={<ButtonLink href={firstActiveProject ? `/tickets/new?projectId=${firstActiveProject}` : '/tickets/new'}><Plus size={17} />Create work ticket</ButtonLink>} />
    <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <nav aria-label="Filter tickets by status" className="flex gap-1 overflow-x-auto rounded-xl border border-line bg-white p-1">
        <Link href={statusHref()} className={`shrink-0 rounded-lg px-3 py-2 text-xs font-bold ${!validStatus ? 'bg-navy text-white' : 'text-muted hover:bg-slate-50'}`}>All</Link>
        {ticketStatusOptions.map((status) => <Link key={status.value} href={statusHref(status.value)} className={`shrink-0 rounded-lg px-3 py-2 text-xs font-bold ${validStatus === status.value ? 'bg-navy text-white' : 'text-muted hover:bg-slate-50'}`}>{status.label}</Link>)}
      </nav>
      <form action="/tickets" className="relative w-full lg:max-w-xs"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input className="field-control min-h-10 py-2 pl-9 text-sm" type="search" name="q" defaultValue={params.q} placeholder="Search tickets or projects" aria-label="Search tickets or projects" />{validStatus && <input type="hidden" name="status" value={validStatus} />}</form>
    </div>

    {!tickets?.length && (validStatus || search) ? <div className="rounded-2xl border border-line bg-white p-7 text-center"><p className="font-bold text-ink">No matching tickets</p><p className="mt-1 text-sm text-muted">Try a different search or status filter.</p></div> : !tickets?.length ? <EmptyState icon={<ClipboardList size={22} />} title="Your ticket list is clear" description="When a project needs work beyond its original scope, start a ticket and keep the record with the job." action={<ButtonLink href={firstActiveProject ? `/tickets/new?projectId=${firstActiveProject}` : '/projects/new'}><Plus size={16} />{firstActiveProject ? 'Create a work ticket' : 'Create a project first'}</ButtonLink>} /> : !filtered.length ? <div className="rounded-2xl border border-line bg-white p-7 text-center"><p className="font-bold text-ink">No matching tickets</p><p className="mt-1 text-sm text-muted">Try a different search or status filter.</p></div> : <div className="overflow-hidden rounded-2xl border border-line bg-white">
      <div className="hidden grid-cols-[145px_minmax(0,1fr)_150px_120px_110px] gap-4 border-b border-line bg-slate-50 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.1em] text-muted md:grid"><span>Ticket</span><span>Work record</span><span>Project</span><span>Status</span><span className="text-right">Total</span></div>
      <div className="divide-y divide-line">{filtered.map((ticket) => {
        const project = projectMap.get(ticket.project_id);
        return <Link key={ticket.id} href={`/tickets/${ticket.id}`} className="grid gap-3 px-4 py-4 transition hover:bg-slate-50 sm:px-5 md:grid-cols-[145px_minmax(0,1fr)_150px_120px_110px] md:items-center md:gap-4">
          <div className="flex items-center justify-between md:block"><span className="font-mono text-xs font-bold text-orange-dark">{ticket.ticket_number}</span><span className="text-xs text-muted md:mt-1 md:block">{formatDate(ticket.occurred_at)}</span></div>
          <div className="min-w-0"><p className="line-clamp-2 text-sm font-semibold text-ink">{ticket.description}</p><p className="mt-1 text-xs text-muted md:hidden">{project?.name || 'Project'} · {formatStatus(ticket.status)}</p></div>
          <div className="hidden min-w-0 md:block"><p className="truncate text-sm font-medium text-ink">{project?.name || 'Project unavailable'}</p><p className="truncate text-xs text-muted">{project?.project_number || ' '}</p></div>
          <div className="hidden md:block"><StatusBadge status={ticket.status} /></div>
          <div className="flex items-center justify-between border-t border-line pt-2 text-xs md:block md:border-0 md:pt-0 md:text-right"><span className="text-muted md:hidden">Documented total</span><span className="font-bold text-ink">{formatCurrency(totals.get(ticket.id) || 0)}</span></div>
        </Link>;
      })}</div>
      {(tickets.length >= 100) && <p className="border-t border-line bg-slate-50 px-5 py-3 text-xs text-muted">Showing the 100 most recent tickets. Use search and status filters to narrow this list.</p>}
    </div>}
    <p className="mt-4 flex items-center gap-2 text-xs leading-5 text-muted"><span className="h-1.5 w-1.5 rounded-full bg-orange" />Statuses are for your tracking. They are not proof of customer approval or payment.</p>
  </>;
}
