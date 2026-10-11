import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus, Receipt, Search } from 'lucide-react';
import { requireWorkspace } from '@/lib/data/workspace';
import { PageHeader, DataSetupMessage, EmptyState } from '@/components/workspace/app-page';
import { ButtonLink } from '@/components/ui/button';
import { StatusBadge } from '@/components/workspace/status-badge';
import { formatDate, formatCurrency } from '@/lib/utils';
import { calculateTicketTotals } from '@/lib/tickets/totals';
import { ticketStatusOptions } from '@/lib/tickets/status';

export const metadata: Metadata = { title: 'Work Tickets' };

type Props = {
  searchParams: Promise<{ status?: string; projectId?: string; q?: string }>;
};

export default async function TicketsPage({ searchParams }: Props) {
  const params = await searchParams;
  const { supabase, workspace } = await requireWorkspace();

  const validStatus = ticketStatusOptions.find((status) => status.value === params.status)?.value;
  const filterProjectId = params.projectId;

  let query = supabase
    .from('work_tickets')
    .select('id, project_id, created_by, ticket_number, description, location, gc_representative, status, occurred_at, updated_at')
    .eq('company_id', workspace.id)
    .order('occurred_at', { ascending: false })
    .limit(100);

  if (validStatus) query = query.eq('status', validStatus);
  if (filterProjectId) query = query.eq('project_id', filterProjectId);

  const { data: tickets, error } = await query;
  if (error) {
    return (
      <>
        <PageHeader title="Work Tickets" description="Document extra work while the details are fresh." />
        <DataSetupMessage />
      </>
    );
  }

  // Fetch projects and all line item entries for calculation
  const [{ data: projects, error: projectError }, { data: labor }, { data: materials }, { data: costs }] =
    await Promise.all([
      supabase
        .from('projects')
        .select('id, name, project_number, is_archived')
        .eq('company_id', workspace.id)
        .order('name'),
      tickets?.length
        ? supabase
            .from('labor_entries')
            .select('ticket_id, hours, rate')
            .eq('company_id', workspace.id)
            .in('ticket_id', tickets.map((ticket) => ticket.id))
        : Promise.resolve({ data: [], error: null }),
      tickets?.length
        ? supabase
            .from('material_entries')
            .select('ticket_id, quantity, unit_cost')
            .eq('company_id', workspace.id)
            .in('ticket_id', tickets.map((ticket) => ticket.id))
        : Promise.resolve({ data: [], error: null }),
      tickets?.length
        ? supabase
            .from('ticket_costs')
            .select('ticket_id, quantity, unit_cost')
            .eq('company_id', workspace.id)
            .in('ticket_id', tickets.map((ticket) => ticket.id))
        : Promise.resolve({ data: [], error: null }),
    ]);

  if (projectError) {
    return (
      <>
        <PageHeader title="Work Tickets" />
        <DataSetupMessage />
      </>
    );
  }

  const projectMap = new Map((projects || []).map((project) => [project.id, project]));
  const totals = new Map<string, number>();

  for (const ticket of tickets || []) {
    totals.set(
      ticket.id,
      calculateTicketTotals({
        labor: (labor || []).filter((entry) => entry.ticket_id === ticket.id).map((l) => ({ hours: Number(l.hours), rate: Number(l.rate) })),
        materials: (materials || []).filter((entry) => entry.ticket_id === ticket.id).map((m) => ({ quantity: Number(m.quantity), unit_cost: Number(m.unit_cost) })),
        costs: (costs || []).filter((entry) => entry.ticket_id === ticket.id).map((c) => ({ quantity: Number(c.quantity), unit_cost: Number(c.unit_cost) })),
      }).total
    );
  }

  const search = (params.q || '').trim().toLowerCase();
  const filtered = (tickets || []).filter((ticket) => {
    const project = projectMap.get(ticket.project_id);
    return (
      !search ||
      ticket.ticket_number.toLowerCase().includes(search) ||
      ticket.description.toLowerCase().includes(search) ||
      (ticket.location && ticket.location.toLowerCase().includes(search)) ||
      (ticket.gc_representative && ticket.gc_representative.toLowerCase().includes(search)) ||
      (project?.name || '').toLowerCase().includes(search) ||
      (project?.project_number || '').toLowerCase().includes(search)
    );
  });

  const firstActiveProject = projects?.find((project) => !project.is_archived)?.id;

  const buildFilterUrl = (newStatus?: string, newProjectId?: string) => {
    const p = new URLSearchParams();
    const st = newStatus !== undefined ? newStatus : validStatus;
    const pr = newProjectId !== undefined ? newProjectId : filterProjectId;
    if (st) p.set('status', st);
    if (pr) p.set('projectId', pr);
    if (params.q) p.set('q', params.q);
    const qs = p.toString();
    return `/tickets${qs ? `?${qs}` : ''}`;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="T&M Tracking Records"
        title="Work Tickets"
        description="Comprehensive field records capturing out-of-scope work, crew labor, material receipts, and photo proof."
        action={
          <ButtonLink
            href={firstActiveProject ? `/tickets/new?projectId=${firstActiveProject}` : '/tickets/new'}
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Create Work Ticket</span>
          </ButtonLink>
        }
      />

      {/* Filter Toolbar */}
      <div className="flex flex-col gap-3.5 lg:flex-row lg:items-center lg:justify-between">
        {/* Status Pills */}
        <div className="flex items-center gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xs">
          <Link
            href={buildFilterUrl('')}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              !validStatus ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All
          </Link>
          {ticketStatusOptions.map((status) => (
            <Link
              key={status.value}
              href={buildFilterUrl(status.value)}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                validStatus === status.value
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {status.label}
            </Link>
          ))}
        </div>

        {/* Project Selector & Search Form */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {/* Project filter dropdown */}
          <form action="/tickets" className="relative">
            <select
              name="projectId"
              defaultValue={filterProjectId || ''}
              className="field-control min-h-10 py-1.5 text-xs font-medium text-slate-700 sm:max-w-[200px]"
              aria-label="Filter by project"
              // On change submit automatically
              onChange={(e) => {
                e.currentTarget.form?.requestSubmit();
              }}
            >
              <option value="">All Projects</option>
              {(projects || []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            {validStatus && <input type="hidden" name="status" value={validStatus} />}
            {params.q && <input type="hidden" name="q" value={params.q} />}
          </form>

          {/* Search box */}
          <form action="/tickets" className="relative w-full sm:max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="field-control min-h-10 py-1.5 pl-9 text-xs sm:text-sm"
              type="search"
              name="q"
              defaultValue={params.q}
              placeholder="Search tickets, work, or GC..."
              aria-label="Search tickets"
            />
            {validStatus && <input type="hidden" name="status" value={validStatus} />}
            {filterProjectId && <input type="hidden" name="projectId" value={filterProjectId} />}
          </form>
        </div>
      </div>

      {/* Main Tickets Content */}
      {!tickets?.length && (validStatus || search || filterProjectId) ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <p className="font-bold text-slate-900">No matching tickets found</p>
          <p className="mt-1 text-xs text-slate-500">
            Try adjusting your search criteria, clearing project filter, or selecting another status tab.
          </p>
          <div className="mt-4">
            <Link
              href="/tickets"
              className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
            >
              Clear all filters
            </Link>
          </div>
        </div>
      ) : !tickets?.length ? (
        <EmptyState
          icon={<Receipt size={22} />}
          title="No work tickets documented yet"
          description="Whenever work is directed outside the original drawings or contract scope, create a work ticket to preserve your documentation trail."
          action={
            <ButtonLink
              href={
                firstActiveProject ? `/tickets/new?projectId=${firstActiveProject}` : '/projects/new'
              }
            >
              <Plus size={16} />
              {firstActiveProject ? 'Create First Ticket' : 'Create Project First'}
            </ButtonLink>
          }
        />
      ) : !filtered.length ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <p className="font-bold text-slate-900">No matching tickets found</p>
          <p className="mt-1 text-xs text-slate-500">No work tickets matched your search query.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/80 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4 font-bold sm:px-6">Ticket #</th>
                  <th className="py-3 px-4 font-bold">Project</th>
                  <th className="py-3 px-4 font-bold">Extra Work Description</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                  <th className="py-3 px-4 text-right font-bold sm:px-6">Documented Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((ticket) => {
                  const project = projectMap.get(ticket.project_id);
                  const total = totals.get(ticket.id) || 0;
                  return (
                    <tr
                      key={ticket.id}
                      className="group transition hover:bg-slate-50/90"
                    >
                      <td className="py-4 px-4 sm:px-6 whitespace-nowrap">
                        <Link href={`/tickets/${ticket.id}`} className="block">
                          <span className="font-mono text-xs font-bold text-blue-600 group-hover:underline">
                            {ticket.ticket_number}
                          </span>
                          <span className="block text-[11px] text-slate-400">
                            {formatDate(ticket.occurred_at)}
                          </span>
                        </Link>
                      </td>

                      <td className="py-4 px-4">
                        <Link href={`/projects/${ticket.project_id}`} className="block max-w-[200px]">
                          <p className="truncate text-xs font-semibold text-slate-800 hover:text-blue-600">
                            {project?.name || 'Project'}
                          </p>
                          {project?.project_number && (
                            <p className="text-[11px] text-slate-400">{project.project_number}</p>
                          )}
                        </Link>
                      </td>

                      <td className="py-4 px-4">
                        <Link href={`/tickets/${ticket.id}`} className="block max-w-lg">
                          <p className="line-clamp-2 text-xs font-medium text-slate-800 leading-relaxed">
                            {ticket.description}
                          </p>
                          {ticket.location && (
                            <span className="mt-1 inline-block text-[11px] text-slate-400">
                              Area: {ticket.location}
                            </span>
                          )}
                        </Link>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <StatusBadge status={ticket.status} size="xs" />
                      </td>

                      <td className="py-4 px-4 text-right sm:px-6 whitespace-nowrap">
                        <span className="font-mono text-xs font-bold text-slate-900 tabular-nums">
                          {formatCurrency(total)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {tickets.length >= 100 && (
            <p className="border-t border-slate-100 bg-slate-50 px-5 py-3 text-xs text-slate-500">
              Showing the 100 most recent tickets. Use search and status filters to narrow results.
            </p>
          )}
        </div>
      )}

      {/* Entitlement Disclaimer */}
      <div className="rounded-xl border border-slate-200/70 bg-slate-50/70 px-4 py-3 text-xs text-slate-500">
        <p>
          <strong>Notice:</strong> Work ticket statuses and documented totals are internal tracking records. They do not constitute verified customer approvals, change orders, or approved invoices.
        </p>
      </div>
    </div>
  );
}
