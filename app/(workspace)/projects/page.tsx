import { openStatuses } from '@/lib/tickets/status';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  Building2,
  FolderPlus,
  MapPin,
  Plus,
  ReceiptText,
  Search,
  Tag,
} from 'lucide-react';
import { requireWorkspace } from '@/lib/data/workspace';
import { WorkspaceDataNotice } from '@/components/workspace/data-notice';
import { PageHeader } from '@/components/ui/page-header';
import { Button, ButtonLink } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Field } from '@/components/ui/field';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatRelative, pluralize } from '@/lib/utils';
import { calculateTicketTotals } from '@/lib/tickets/totals';

export const metadata: Metadata = { title: 'Projects' };

type Props = {
  searchParams: Promise<{ tab?: string; q?: string }>;
};

export default async function ProjectsPage({ searchParams }: Props) {
  const params = await searchParams;
  const tab = params.tab === 'archived' ? 'archived' : 'active';
  const search = (params.q || '').trim();

  const { supabase, workspace } = await requireWorkspace();

  const [projectsRes, ticketsRes, laborRes, materialsRes, costsRes] = await Promise.all([
    supabase
      .from('projects')
      .select(
        'id, name, project_number, site_address, general_contractor, notes, is_archived, created_at, updated_at'
      )
      .eq('company_id', workspace.id)
      .order('updated_at', { ascending: false }),
    supabase.from('work_tickets').select('id, project_id, status').eq('company_id', workspace.id),
    supabase.from('labor_entries').select('ticket_id, hours, rate').eq('company_id', workspace.id),
    supabase
      .from('material_entries')
      .select('ticket_id, quantity, unit_cost')
      .eq('company_id', workspace.id),
    supabase.from('ticket_costs').select('ticket_id, quantity, unit_cost').eq('company_id', workspace.id),
  ]);

  if (projectsRes.error || ticketsRes.error) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Commercial jobs"
          title="Projects"
          description="Keep every jobsite's records together."
        />
        <WorkspaceDataNotice />
      </div>
    );
  }

  const projects = projectsRes.data ?? [];
  const tickets = ticketsRes.data ?? [];
  const labourRows = laborRes.data ?? [];
  const materialRows = materialsRes.data ?? [];
  const costRows = costsRes.data ?? [];

  const ticketTotalById = new Map<string, number>();
  for (const ticket of tickets) {
    ticketTotalById.set(
      ticket.id,
      calculateTicketTotals({
        labor: labourRows
          .filter((row) => row.ticket_id === ticket.id)
          .map((row) => ({ hours: Number(row.hours), rate: Number(row.rate) })),
        materials: materialRows
          .filter((row) => row.ticket_id === ticket.id)
          .map((row) => ({ quantity: Number(row.quantity), unit_cost: Number(row.unit_cost) })),
        costs: costRows
          .filter((row) => row.ticket_id === ticket.id)
          .map((row) => ({ quantity: Number(row.quantity), unit_cost: Number(row.unit_cost) })),
      }).total
    );
  }

  const statsFor = (projectId: string) => {
    const projectTickets = tickets.filter((ticket) => ticket.project_id === projectId);
    const open = projectTickets.filter((ticket) =>
      openStatuses.includes(ticket.status)
    ).length;
    return {
      ticketCount: projectTickets.length,
      open,
      documentedTotal: projectTickets.reduce(
        (sum, ticket) => sum + (ticketTotalById.get(ticket.id) ?? 0),
        0
      ),
    };
  };

  const activeProjects = projects.filter((project) => !project.is_archived);
  const archivedProjects = projects.filter((project) => project.is_archived);
  const list = tab === 'archived' ? archivedProjects : activeProjects;

  const needle = search.toLowerCase();
  const filtered = list.filter((project) => {
    if (!needle) return true;
    return (
      project.name.toLowerCase().includes(needle) ||
      (project.project_number ?? '').toLowerCase().includes(needle) ||
      (project.general_contractor ?? '').toLowerCase().includes(needle) ||
      (project.site_address ?? '').toLowerCase().includes(needle)
    );
  });

  const tabHref = (nextTab: 'active' | 'archived') =>
    `/projects?tab=${nextTab}${search ? `&q=${encodeURIComponent(search)}` : ''}`;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Commercial jobs"
        title="Projects"
        description="Job numbers, general contractors and documented extra work, grouped by jobsite."
        action={
          <ButtonLink href="/projects/new">
            <Plus size={16} strokeWidth={2.5} aria-hidden="true" />
            New project
          </ButtonLink>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex w-full rounded-lg border border-line bg-surface-2 p-0.5 sm:w-auto">
          {[
            { key: 'active' as const, label: 'Active', count: activeProjects.length },
            { key: 'archived' as const, label: 'Archived', count: archivedProjects.length },
          ].map((option) => {
            const selected = tab === option.key;
            return (
              <Link
                key={option.key}
                href={tabHref(option.key)}
                aria-current={selected ? 'page' : undefined}
                className={`flex flex-1 items-center justify-center gap-2 rounded-[6px] px-3.5 py-1.5 text-[13px] font-semibold transition-all duration-150 sm:flex-none ${
                  selected ? 'bg-surface text-ink shadow-xs' : 'text-muted hover:text-ink'
                }`}
              >
                {option.label}
                <span className="text-[11px] font-semibold text-subtle tabular-nums">
                  {option.count}
                </span>
              </Link>
            );
          })}
        </div>

        <form action="/projects" method="get" className="flex w-full items-end gap-2 sm:max-w-md" role="search">
          <Field id="project-search" label="Search projects" labelHidden className="flex-1">
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
                  placeholder="Search projects"
                  className="field-control pl-9"
                  autoComplete="off"
                />
              </div>
            )}
          </Field>
          {tab === 'archived' && <input type="hidden" name="tab" value="archived" />}
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon={<FolderPlus size={20} aria-hidden="true" />}
          title="No projects yet"
          description="Add your first commercial job with its job number, jobsite address and general contractor so field tickets have a home."
          action={
            <ButtonLink href="/projects/new">
              <Plus size={16} aria-hidden="true" />
              Create first project
            </ButtonLink>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Search size={20} aria-hidden="true" />}
          tone="neutral"
          title={search ? `No projects match “${search}”` : 'Nothing in this tab'}
          description={
            search
              ? 'Try a shorter search, or check the other tab — archived jobs stay fully searchable.'
              : tab === 'archived'
                ? 'Archived projects keep their tickets and evidence, and can be restored at any time.'
                : 'There are no active projects right now.'
          }
          action={
            <ButtonLink href={search ? '/projects' : tabHref(tab === 'archived' ? 'active' : 'archived')} variant="secondary">
              {search ? 'Clear search' : `View ${tab === 'archived' ? 'active' : 'archived'}`}
            </ButtonLink>
          }
        />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((project) => {
            const stats = statsFor(project.id);
            return (
              <li key={project.id}>
                <Card as="article" className="flex h-full flex-col">
                  <div className="flex items-start justify-between gap-3 p-5">
                    <div className="min-w-0">
                      {project.project_number && (
                        <span className="inline-flex items-center gap-1 font-mono text-[12px] font-semibold text-subtle">
                          <Tag size={11} aria-hidden="true" />
                          {project.project_number}
                        </span>
                      )}
                      <h2 className="mt-1.5 text-[15px] font-semibold leading-snug tracking-[-0.012em] text-ink">
                        <Link
                          href={`/projects/${project.id}`}
                          className="rounded transition-colors duration-150 hover:text-brand-700"
                        >
                          {project.name}
                        </Link>
                      </h2>
                    </div>
                    {project.is_archived ? (
                      <Badge tone="neutral" size="sm" className="shrink-0">
                        Archived
                      </Badge>
                    ) : (
                      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-success-line bg-success-soft px-2 py-0.5 text-[11px] font-semibold text-success">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                        Active
                      </span>
                    )}
                  </div>

                  <dl className="space-y-1.5 px-5 text-[13px]">
                    <div className="flex items-start gap-2">
                      <dt className="sr-only">General contractor</dt>
                      <Building2 size={14} className="mt-0.5 shrink-0 text-faint" aria-hidden="true" />
                      <dd className="min-w-0 truncate text-body">
                        {project.general_contractor || 'General contractor not set'}
                      </dd>
                    </div>
                    <div className="flex items-start gap-2">
                      <dt className="sr-only">Jobsite address</dt>
                      <MapPin size={14} className="mt-0.5 shrink-0 text-faint" aria-hidden="true" />
                      <dd className="min-w-0 truncate text-body">
                        {project.site_address || 'Jobsite address not set'}
                      </dd>
                    </div>
                  </dl>

                  <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden border-y border-line bg-line">
                    <div className="bg-surface px-5 py-3">
                      <dt className="text-[11px] text-subtle">Documented</dt>
                      <dd className="mt-0.5 font-mono text-[15px] font-semibold text-ink">
                        {formatCurrency(stats.documentedTotal)}
                      </dd>
                    </div>
                    <div className="bg-surface px-5 py-3">
                      <dt className="text-[11px] text-subtle">Tickets</dt>
                      <dd className="mt-0.5 text-[15px] font-semibold text-ink tabular-nums">
                        {stats.ticketCount}
                        {stats.open > 0 && (
                          <span className="ml-1.5 text-[12px] font-medium text-warning">
                            {stats.open} open
                          </span>
                        )}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-auto flex items-center justify-between gap-2 px-5 py-3.5">
                    <Link
                      href={`/projects/${project.id}`}
                      className="link inline-flex items-center gap-1 text-[13px]"
                    >
                      Open project
                      <ArrowRight size={13} aria-hidden="true" />
                    </Link>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-faint">
                        Updated {formatRelative(project.updated_at)}
                      </span>
                      {!project.is_archived && (
                        <Link
                          href={`/tickets/new?projectId=${project.id}`}
                          className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-line-strong bg-surface px-2.5 text-[12.5px] font-semibold text-body shadow-xs transition-colors duration-150 hover:bg-surface-2 hover:text-ink"
                          aria-label={`New ticket for ${project.name}`}
                        >
                          <ReceiptText size={13} aria-hidden="true" />
                          Ticket
                        </Link>
                      )}
                    </div>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      {tab === 'active' && activeProjects.length > 0 && (
        <p className="text-[12px] text-muted">
          {pluralize(activeProjects.length, 'active project')} · {pluralize(tickets.length, 'ticket')} recorded
          across the workspace. Archive a project to hide it from ticket creation without deleting
          anything.
        </p>
      )}
    </div>
  );
}
