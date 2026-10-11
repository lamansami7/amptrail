import type { Metadata } from 'next';
import Link from 'next/link';
import { Filter, Plus, ReceiptText, Search, X } from 'lucide-react';
import { requireWorkspace } from '@/lib/data/workspace';
import { WorkspaceDataNotice } from '@/components/workspace/data-notice';
import { PageHeader } from '@/components/ui/page-header';
import { Button, ButtonLink } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Field, Select } from '@/components/ui/field';
import { TabBar } from '@/components/ui/tabs';
import { TableShell, Td, Th, Tr } from '@/components/ui/table';
import { StatusBadge } from '@/components/workspace/status-badge';
import { formatCurrency, formatDate, pluralize } from '@/lib/utils';
import { calculateTicketTotals } from '@/lib/tickets/totals';
import { ticketStatusOptions } from '@/lib/tickets/status';

export const metadata: Metadata = { title: 'Work tickets' };

type Props = {
  searchParams: Promise<{ status?: string; projectId?: string; q?: string }>;
};

const PAGE_LIMIT = 100;

export default async function TicketsPage({ searchParams }: Props) {
  const params = await searchParams;
  const { supabase, workspace } = await requireWorkspace();

  const activeStatus = ticketStatusOptions.find((status) => status.value === params.status)?.value;
  const projectFilter = params.projectId?.trim() || undefined;
  const search = (params.q || '').trim();

  let query = supabase
    .from('work_tickets')
    .select(
      'id, project_id, created_by, ticket_number, description, location, gc_representative, status, occurred_at, updated_at'
    )
    .eq('company_id', workspace.id)
    .order('occurred_at', { ascending: false })
    .limit(PAGE_LIMIT);

  if (activeStatus) query = query.eq('status', activeStatus);
  if (projectFilter) query = query.eq('project_id', projectFilter);

  const { data: tickets, error } = await query;

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="T&amp;M documentation"
          title="Work tickets"
          description="Document extra work while the details are still fresh."
        />
        <WorkspaceDataNotice />
      </div>
    );
  }

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
      <div className="space-y-6">
        <PageHeader title="Work tickets" />
        <WorkspaceDataNotice />
      </div>
    );
  }

  const projectById = new Map((projects ?? []).map((project) => [project.id, project]));
  const totalByTicket = new Map<string, number>();
  for (const ticket of tickets ?? []) {
    totalByTicket.set(
      ticket.id,
      calculateTicketTotals({
        labor: (labor ?? [])
          .filter((entry) => entry.ticket_id === ticket.id)
          .map((entry) => ({ hours: Number(entry.hours), rate: Number(entry.rate) })),
        materials: (materials ?? [])
          .filter((entry) => entry.ticket_id === ticket.id)
          .map((entry) => ({ quantity: Number(entry.quantity), unit_cost: Number(entry.unit_cost) })),
        costs: (costs ?? [])
          .filter((entry) => entry.ticket_id === ticket.id)
          .map((entry) => ({ quantity: Number(entry.quantity), unit_cost: Number(entry.unit_cost) })),
      }).total
    );
  }

  const needle = search.toLowerCase();
  const rows = (tickets ?? []).filter((ticket) => {
    if (!needle) return true;
    const project = projectById.get(ticket.project_id);
    return (
      ticket.ticket_number.toLowerCase().includes(needle) ||
      ticket.description.toLowerCase().includes(needle) ||
      (ticket.location ?? '').toLowerCase().includes(needle) ||
      (ticket.gc_representative ?? '').toLowerCase().includes(needle) ||
      (project?.name ?? '').toLowerCase().includes(needle) ||
      (project?.project_number ?? '').toLowerCase().includes(needle)
    );
  });

  const hasFilters = Boolean(activeStatus || projectFilter || search);
  const firstActiveProject = (projects ?? []).find((project) => !project.is_archived)?.id;
  const newTicketHref = firstActiveProject
    ? `/tickets/new?projectId=${firstActiveProject}`
    : '/tickets/new';

  const filterQuery = (overrides: { status?: string | null; projectId?: string | null }) => {
    const search2 = new URLSearchParams();
    const status = overrides.status === undefined ? activeStatus : overrides.status;
    const project = overrides.projectId === undefined ? projectFilter : overrides.projectId;
    if (status) search2.set('status', status);
    if (project) search2.set('projectId', project);
    if (search) search2.set('q', search);
    const queryString = search2.toString();
    return `/tickets${queryString ? `?${queryString}` : ''}`;
  };

  const statusTabs = [
    { href: filterQuery({ status: null }), label: 'All', active: !activeStatus },
    ...ticketStatusOptions.map((status) => ({
      href: filterQuery({ status: status.value }),
      label: status.label,
      active: activeStatus === status.value,
    })),
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="T&amp;M documentation"
        title="Work tickets"
        description="Every record of out-of-scope work, the crew time it took, and the materials it consumed."
        action={
          <ButtonLink href={newTicketHref}>
            <Plus size={16} strokeWidth={2.5} aria-hidden="true" />
            New ticket
          </ButtonLink>
        }
      />

      {/* Filters */}
      <Card className="p-4 sm:p-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <form
              action="/tickets"
              method="get"
              className="flex w-full items-end gap-2 sm:max-w-lg"
              role="search"
            >
              <Field id="ticket-search" label="Search" labelHidden className="flex-1">
                {(props) => (
                  <div className="relative">
                    <Search
                      size={15}
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint"
                    />
                    <input
                      {...props}
                      name="q"
                      type="search"
                      defaultValue={search}
                      placeholder="Search ticket number, description, area or GC…"
                      className="field-control pl-9"
                      autoComplete="off"
                    />
                  </div>
                )}
              </Field>
              {activeStatus && <input type="hidden" name="status" value={activeStatus} />}
              {projectFilter && <input type="hidden" name="projectId" value={projectFilter} />}
              <Button type="submit" variant="secondary">
                Search
              </Button>
            </form>

            <form action="/tickets" method="get" className="flex items-end gap-2">
              <Field id="ticket-project" label="Project" labelHidden className="min-w-[11rem] flex-1">
                {(props) => (
                  <Select {...props} name="projectId" defaultValue={projectFilter ?? ''}>
                    <option value="">All projects</option>
                    {(projects ?? []).map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                        {project.is_archived ? ' (archived)' : ''}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
              {activeStatus && <input type="hidden" name="status" value={activeStatus} />}
              {search && <input type="hidden" name="q" value={search} />}
              <Button type="submit" variant="secondary" iconOnly aria-label="Apply project filter">
                <Filter size={15} aria-hidden="true" />
              </Button>
            </form>
          </div>

          <TabBar items={statusTabs} label="Filter tickets by status" />
        </div>
      </Card>

      {/* Results meta */}
      {(tickets ?? []).length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-[13px] text-muted">
          <p>
            Showing <span className="font-semibold text-ink">{rows.length}</span> of{' '}
            {pluralize((tickets ?? []).length, 'ticket')}
            {activeStatus ? ` in ${ticketStatusOptions.find((s) => s.value === activeStatus)?.label}` : ''}
            {projectFilter ? ' for this project' : ''}
          </p>
          {hasFilters && (
            <Link
              href="/tickets"
              className="inline-flex items-center gap-1.5 font-semibold text-brand-700 transition-colors duration-150 hover:text-brand-800"
            >
              <X size={13} aria-hidden="true" />
              Clear filters
            </Link>
          )}
        </div>
      )}

      {(tickets ?? []).length === 0 && hasFilters ? (
        <EmptyState
          icon={<Search size={20} aria-hidden="true" />}
          tone="neutral"
          title="No tickets match these filters"
          description="Try a different status, clear the project filter, or search a shorter phrase."
          action={
            <ButtonLink href="/tickets" variant="secondary">
              Clear filters
            </ButtonLink>
          }
        />
      ) : (tickets ?? []).length === 0 ? (
        <EmptyState
          icon={<ReceiptText size={20} aria-hidden="true" />}
          title="No work tickets yet"
          description="When work is directed outside the drawings or contract scope, create a ticket to record the hours, materials and evidence behind it."
          action={
            <ButtonLink href={firstActiveProject ? newTicketHref : '/projects/new'}>
              <Plus size={16} aria-hidden="true" />
              {firstActiveProject ? 'Create first ticket' : 'Create a project first'}
            </ButtonLink>
          }
        />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<Search size={20} aria-hidden="true" />}
          tone="neutral"
          title={`No tickets match “${search}”`}
          description="Check the spelling, or search by ticket number, jobsite area or the general contractor."
          action={
            <ButtonLink href="/tickets" variant="secondary">
              Clear search
            </ButtonLink>
          }
        />
      ) : (
        <>
          {/* Desktop / tablet table */}
          <Card flush className="hidden sm:block">
            <TableShell caption="Work tickets">
              <thead>
                <tr>
                  <Th className="w-[11rem]">Ticket</Th>
                  <Th className="w-[13rem]">Project</Th>
                  <Th>Extra work</Th>
                  <Th className="w-[10rem]">Status</Th>
                  <Th align="right" className="w-[8rem]">
                    Documented
                  </Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((ticket) => {
                  const project = projectById.get(ticket.project_id);
                  return (
                    <Tr key={ticket.id} interactive>
                      <Td>
                        <Link href={`/tickets/${ticket.id}`} className="block rounded">
                          <span className="font-mono text-[13px] font-semibold text-brand-700">
                            {ticket.ticket_number}
                          </span>
                          <span className="mt-0.5 block text-[12px] text-subtle">
                            {formatDate(ticket.occurred_at)}
                          </span>
                        </Link>
                      </Td>
                      <Td>
                        <Link href={`/projects/${ticket.project_id}`} className="block rounded">
                          <span className="block truncate text-[13.5px] font-medium text-ink">
                            {project?.name ?? 'Project'}
                          </span>
                          {project?.project_number && (
                            <span className="mt-0.5 block font-mono text-[12px] text-subtle">
                              {project.project_number}
                            </span>
                          )}
                        </Link>
                      </Td>
                      <Td>
                        <Link href={`/tickets/${ticket.id}`} className="block rounded">
                          <span className="line-clamp-2 text-[13.5px] leading-5 text-body">
                            {ticket.description}
                          </span>
                          {ticket.location && (
                            <span className="mt-1 block text-[12px] text-subtle">{ticket.location}</span>
                          )}
                        </Link>
                      </Td>
                      <Td>
                        <StatusBadge status={ticket.status} size="xs" />
                      </Td>
                      <Td align="right">
                        <span className="font-mono text-[13px] font-semibold text-ink">
                          {formatCurrency(totalByTicket.get(ticket.id) ?? 0)}
                        </span>
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </TableShell>
            {(tickets ?? []).length >= PAGE_LIMIT && (
              <p className="border-t border-line bg-surface-2/60 px-5 py-3 text-[12px] text-muted sm:px-6">
                Showing the {PAGE_LIMIT} most recent tickets. Narrow the list with search, status or
                project filters.
              </p>
            )}
          </Card>

          {/* Mobile cards */}
          <ul className="space-y-3 sm:hidden">
            {rows.map((ticket) => {
              const project = projectById.get(ticket.project_id);
              return (
                <li key={ticket.id}>
                  <Link
                    href={`/tickets/${ticket.id}`}
                    className="block rounded-xl border border-line bg-surface p-4 shadow-xs transition-colors duration-150 active:bg-surface-2"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
                      <div className="min-w-0 flex-1">
                        <span className="font-mono text-[13px] font-semibold text-brand-700">
                          {ticket.ticket_number}
                        </span>
                        <span className="ml-2 text-[12px] text-subtle">
                          {formatDate(ticket.occurred_at)}
                        </span>
                        <p className="mt-1.5 line-clamp-2 text-[13.5px] leading-5 text-body">
                          {ticket.description}
                        </p>
                      </div>
                      <StatusBadge status={ticket.status} size="xs" />
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-3">
                      <span className="min-w-0 truncate text-[12px] text-subtle">
                        {project?.name ?? 'Project'}
                        {ticket.location ? ` · ${ticket.location}` : ''}
                      </span>
                      <span className="shrink-0 font-mono text-[13px] font-semibold text-ink">
                        {formatCurrency(totalByTicket.get(ticket.id) ?? 0)}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <p className="rounded-xl border border-line bg-surface-2/70 px-4 py-3 text-[12px] leading-5 text-muted">
        <strong className="font-semibold text-body">Tracking record:</strong> documented totals are
        calculated from the lines your team enters, and statuses are internal workflow labels — not
        verified customer approvals, executed change orders, or approved invoices.
      </p>
    </div>
  );
}
