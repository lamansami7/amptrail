import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  Camera,
  CircleDollarSign,
  ClipboardCheck,
  FolderKanban,
  FolderPlus,
  Plus,
  ReceiptText,
  TrendingUp,
} from 'lucide-react';
import { requireWorkspace } from '@/lib/data/workspace';
import { WorkspaceDataNotice } from '@/components/workspace/data-notice';
import { Alert } from '@/components/ui/alert';
import { ButtonLink } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat';
import { TableShell, Td, Th, Tr } from '@/components/ui/table';
import { StatusBadge } from '@/components/workspace/status-badge';
import { statusDotClass, ticketStatusOptions } from '@/lib/tickets/status';
import { calculateTicketTotals } from '@/lib/tickets/totals';
import { formatCurrency, formatDate, formatRelative, pluralize } from '@/lib/utils';

export const metadata: Metadata = { title: 'Overview' };

// Shared status metadata keeps the dashboard consistent with every badge.
const statusOrder = ticketStatusOptions;

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default async function DashboardPage() {
  const { supabase, user, workspace } = await requireWorkspace();

  const [
    projectsRes,
    allTicketsRes,
    recentTicketsRes,
    recentActivityRes,
    allLaborRes,
    allMaterialsRes,
    allCostsRes,
    evidenceRes,
  ] = await Promise.all([
    supabase
      .from('projects')
      .select('id, name, project_number, site_address, general_contractor, is_archived, updated_at')
      .eq('company_id', workspace.id)
      .order('updated_at', { ascending: false }),
    supabase.from('work_tickets').select('id, status, occurred_at').eq('company_id', workspace.id),
    supabase
      .from('work_tickets')
      .select('id, project_id, ticket_number, description, status, occurred_at, updated_at')
      .eq('company_id', workspace.id)
      .order('updated_at', { ascending: false })
      .limit(6),
    supabase
      .from('activity_events')
      .select('id, event_type, description, created_at')
      .eq('company_id', workspace.id)
      .order('created_at', { ascending: false })
      .limit(6),
    supabase.from('labor_entries').select('ticket_id, hours, rate').eq('company_id', workspace.id),
    supabase
      .from('material_entries')
      .select('ticket_id, quantity, unit_cost')
      .eq('company_id', workspace.id),
    supabase.from('ticket_costs').select('ticket_id, quantity, unit_cost').eq('company_id', workspace.id),
    supabase.from('evidence_files').select('id', { count: 'exact', head: true }).eq('company_id', workspace.id),
  ]);

  if (
    projectsRes.error ||
    allTicketsRes.error ||
    recentTicketsRes.error ||
    recentActivityRes.error ||
    allLaborRes.error ||
    allMaterialsRes.error ||
    allCostsRes.error
  ) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Workspace"
          title="Overview"
          description="A live picture of your documented field work."
        />
        <WorkspaceDataNotice />
      </div>
    );
  }

  const allProjects = projectsRes.data ?? [];
  const activeProjects = allProjects.filter((project) => !project.is_archived);
  const allTickets = allTicketsRes.data ?? [];
  const recentTickets = recentTicketsRes.data ?? [];
  const labourRows = allLaborRes.data ?? [];
  const materialRows = allMaterialsRes.data ?? [];
  const costRows = allCostsRes.data ?? [];
  const evidenceCount = evidenceRes.count ?? 0;

  const counts = statusOrder.reduce<Record<string, number>>((accumulator, status) => {
    accumulator[status.value] = allTickets.filter((ticket) => ticket.status === status.value).length;
    return accumulator;
  }, {});
  const openCount = (counts.draft ?? 0) + (counts.ready_for_review ?? 0) + (counts.submitted ?? 0);

  const workspaceTotals = calculateTicketTotals({
    labor: labourRows.map((row) => ({ hours: Number(row.hours), rate: Number(row.rate) })),
    materials: materialRows.map((row) => ({ quantity: Number(row.quantity), unit_cost: Number(row.unit_cost) })),
    costs: costRows.map((row) => ({ quantity: Number(row.quantity), unit_cost: Number(row.unit_cost) })),
  });

  const totalsByTicket = new Map<string, number>();
  for (const ticket of recentTickets) {
    totalsByTicket.set(
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

  const projectById = new Map(allProjects.map((project) => [project.id, project]));
  const firstName = (user.user_metadata?.full_name as string | undefined)?.split(' ')[0] ?? '';
  const hasContent = allProjects.length > 0 || allTickets.length > 0;
  const totalTickets = allTickets.length;

  const attention = [
    counts.ready_for_review
      ? {
          title: pluralize(counts.ready_for_review, 'ticket') + ' ready for review',
          body: 'Verify the details, then submit to the general contractor.',
          href: '/tickets?status=ready_for_review',
          cta: 'Review tickets',
          tone: 'warning' as const,
        }
      : null,
    counts.draft
      ? {
          title: pluralize(counts.draft, 'draft ticket') + ' not submitted',
          body: 'Drafts are not visible to anyone else yet — finish them while details are fresh.',
          href: '/tickets?status=draft',
          cta: 'Finish drafts',
          tone: 'info' as const,
        }
      : null,
  ].filter(Boolean) as Array<{
    title: string;
    body: string;
    href: string;
    cta: string;
    tone: 'warning' | 'info';
  }>;

  return (
    <div className="space-y-6 sm:space-y-7">
      <PageHeader
        eyebrow={formatDate(new Date().toISOString(), {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        })}
        title={firstName ? `${greeting()}, ${firstName}` : greeting()}
        description={`Everything documented across ${workspace.name} — extra work, crew hours, materials and jobsite evidence.`}
        action={
          <>
            <ButtonLink href={activeProjects.length ? '/tickets/new' : '/projects/new'}>
              <Plus size={16} strokeWidth={2.5} aria-hidden="true" />
              {activeProjects.length ? 'New work ticket' : 'Create first project'}
            </ButtonLink>
            <ButtonLink href="/projects/new" variant="secondary">
              <FolderPlus size={15} aria-hidden="true" />
              <span className="hidden sm:inline">New project</span>
              <span className="sm:hidden">Project</span>
            </ButtonLink>
          </>
        }
      />

      {/* Getting started — only while the workspace is genuinely empty */}
      {!hasContent && (
        <Card className="overflow-hidden">
          <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-10 lg:p-8">
            <div>
              <p className="eyebrow">Getting started</p>
              <h2 className="mt-2 text-xl font-semibold tracking-[-0.02em] text-ink">
                Document your first piece of extra work.
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                AmpTrail keeps a clean record of work that falls outside the contract — who directed
                it, what it cost, and what the jobsite looked like at the time. Three steps is all it
                takes to get your first record on file.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <ButtonLink href="/projects/new">
                  <Plus size={16} aria-hidden="true" />
                  Create your first project
                </ButtonLink>
                <ButtonLink href="/tickets" variant="secondary">
                  How tickets work
                </ButtonLink>
              </div>
            </div>

            <ol className="space-y-3">
              {[
                {
                  title: 'Add the project',
                  body: 'Job name, number, jobsite address and the general contractor.',
                },
                {
                  title: 'Capture the work ticket',
                  body: 'Describe the extra work, then add labor hours, materials and equipment.',
                },
                {
                  title: 'Attach evidence and export',
                  body: 'Snap photos on site, then download a professional PDF record.',
                },
              ].map((step, index) => (
                <li key={step.title} className="flex gap-3 rounded-xl border border-line bg-surface-2/60 p-4">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-600 text-[12px] font-semibold text-white">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-[13.5px] font-semibold text-ink">{step.title}</p>
                    <p className="mt-0.5 text-[13px] leading-5 text-muted">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </Card>
      )}

      {/* Attention strip */}
      {attention.length > 0 && (
        <div className="grid gap-3 lg:grid-cols-2">
          {attention.map((item) => (
            <Alert key={item.title} tone={item.tone} title={item.title}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[13px]">{item.body}</span>
                <Link href={item.href} className="link inline-flex items-center gap-1 text-[13px]">
                  {item.cta}
                  <ArrowRight size={13} aria-hidden="true" />
                </Link>
              </div>
            </Alert>
          ))}
        </div>
      )}

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Documented work value"
          value={formatCurrency(workspaceTotals.total)}
          context={`Across ${pluralize(totalTickets, 'work ticket')}`}
          tone="brand"
          icon={<CircleDollarSign size={17} aria-hidden="true" />}
          footer={
            <dl className="flex items-center justify-between gap-2 text-[12px]">
              <div>
                <dt className="text-subtle">Labor</dt>
                <dd className="font-semibold text-body">{formatCurrency(workspaceTotals.labor)}</dd>
              </div>
              <div>
                <dt className="text-subtle">Materials</dt>
                <dd className="font-semibold text-body">{formatCurrency(workspaceTotals.materials)}</dd>
              </div>
              <div>
                <dt className="text-subtle">Equipment</dt>
                <dd className="font-semibold text-body">{formatCurrency(workspaceTotals.other)}</dd>
              </div>
            </dl>
          }
        />
        <StatCard
          label="Open tickets"
          value={openCount}
          context={`${counts.draft ?? 0} draft · ${counts.ready_for_review ?? 0} ready · ${counts.submitted ?? 0} submitted`}
          tone={openCount > 0 ? 'warning' : 'neutral'}
          icon={<ClipboardCheck size={17} aria-hidden="true" />}
          footer={
            <Link href="/tickets" className="link inline-flex items-center gap-1 text-[13px]">
              Open the ticket board
              <ArrowRight size={13} aria-hidden="true" />
            </Link>
          }
        />
        <StatCard
          label="Active projects"
          value={activeProjects.length}
          context={
            allProjects.length - activeProjects.length > 0
              ? `${pluralize(allProjects.length - activeProjects.length, 'project')} archived`
              : 'No archived projects'
          }
          icon={<FolderKanban size={17} aria-hidden="true" />}
          footer={
            <Link href="/projects" className="link inline-flex items-center gap-1 text-[13px]">
              Manage projects
              <ArrowRight size={13} aria-hidden="true" />
            </Link>
          }
        />
        <StatCard
          label="Evidence photos"
          value={evidenceCount}
          context="Private, company-scoped storage"
          icon={<Camera size={17} aria-hidden="true" />}
          footer={
            <Link href="/evidence" className="link inline-flex items-center gap-1 text-[13px]">
              Open evidence library
              <ArrowRight size={13} aria-hidden="true" />
            </Link>
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        {/* Recent tickets */}
        <Card flush>
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6">
            <div>
              <h2 className="h3">Recent work tickets</h2>
              <p className="mt-0.5 text-[13px] text-muted">Most recently updated field records</p>
            </div>
            <Link href="/tickets" className="link inline-flex items-center gap-1 text-[13px]">
              All tickets
              <ArrowRight size={13} aria-hidden="true" />
            </Link>
          </div>

          {recentTickets.length === 0 ? (
            <div className="px-5 pb-5 sm:px-6 sm:pb-6">
              <EmptyState
                icon={<ReceiptText size={20} aria-hidden="true" />}
                title="No work tickets yet"
                description={
                  activeProjects.length
                    ? 'Capture extra work on site while the crew is still there.'
                    : 'Add a project first — every ticket belongs to a jobsite.'
                }
                action={
                  <ButtonLink href={activeProjects.length ? '/tickets/new' : '/projects/new'}>
                    <Plus size={15} aria-hidden="true" />
                    {activeProjects.length ? 'Create first ticket' : 'Create project'}
                  </ButtonLink>
                }
              />
            </div>
          ) : (
            <>
              {/* Phones: the total must never be off-screen. */}
              <ul className="divide-y divide-line border-t border-line md:hidden">
                {recentTickets.map((ticket) => {
                  const project = projectById.get(ticket.project_id);
                  return (
                    <li key={ticket.id}>
                      <Link
                        href={`/tickets/${ticket.id}`}
                        className="block px-5 py-3.5 transition-colors duration-150 active:bg-surface-2"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <span className="whitespace-nowrap font-mono text-[13px] font-semibold text-brand-700">
                              {ticket.ticket_number}
                            </span>
                            <span className="ml-2 whitespace-nowrap text-[12px] text-subtle">
                              {formatDate(ticket.occurred_at)}
                            </span>
                            <p className="mt-1 truncate text-[13.5px] font-medium text-ink">
                              {project?.name ?? 'Project'}
                            </p>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-1.5">
                            <span className="whitespace-nowrap font-mono text-[13px] font-semibold text-ink">
                              {formatCurrency(totalsByTicket.get(ticket.id) ?? 0)}
                            </span>
                            <StatusBadge status={ticket.status} size="xs" />
                          </div>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>

              <div className="hidden border-t border-line md:block">
                <TableShell caption="Most recently updated work tickets">
                  <thead>
                    <tr>
                      <Th className="w-[9.5rem]">Ticket</Th>
                      <Th>Project</Th>
                      <Th>Status</Th>
                      <Th align="right">Documented</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTickets.map((ticket) => {
                      const project = projectById.get(ticket.project_id);
                      return (
                        <Tr key={ticket.id} interactive>
                          <Td>
                            <Link href={`/tickets/${ticket.id}`} className="group/ticket block rounded">
                              <span className="whitespace-nowrap font-mono text-[13px] font-semibold text-brand-700 group-hover/ticket:underline">
                                {ticket.ticket_number}
                              </span>
                              <span className="mt-0.5 block whitespace-nowrap text-[12px] text-subtle">
                                {formatDate(ticket.occurred_at)}
                              </span>
                            </Link>
                          </Td>
                          <Td>
                            <Link href={`/projects/${ticket.project_id}`} className="block rounded">
                              <span className="block truncate text-[13.5px] font-medium text-ink">
                                {project?.name ?? 'Project'}
                              </span>
                              <span className="mt-0.5 block line-clamp-1 text-[12px] text-subtle">
                                {project?.project_number ??
                                  project?.general_contractor ??
                                  ticket.description}
                              </span>
                            </Link>
                          </Td>
                          <Td>
                            <StatusBadge status={ticket.status} size="xs" />
                          </Td>
                          <Td align="right">
                            <span className="whitespace-nowrap font-mono text-[13px] font-semibold text-ink">
                              {formatCurrency(totalsByTicket.get(ticket.id) ?? 0)}
                            </span>
                          </Td>
                        </Tr>
                      );
                    })}
                  </tbody>
                </TableShell>
              </div>
            </>
          )}
        </Card>

        {/* Right rail */}
        <div className="space-y-6">
          {totalTickets > 0 && (
            <Card flush>
              <div className="flex items-baseline justify-between gap-3 px-5 py-4">
                <div>
                  <h2 className="h3">Ticket pipeline</h2>
                  <p className="mt-0.5 text-[13px] text-muted">
                    {pluralize(totalTickets, 'record')} tracked
                  </p>
                </div>
                <Link href="/tickets" className="link text-[13px]">
                  View
                </Link>
              </div>

              <div className="px-5">
                <div className="flex h-2 w-full overflow-hidden rounded-full bg-surface-3" aria-hidden="true">
                  {statusOrder.map((status) =>
                    counts[status.value] ? (
                      <span
                        key={status.value}
                        className={statusDotClass(status.value)}
                        style={{ width: `${(counts[status.value] / totalTickets) * 100}%` }}
                      />
                    ) : null
                  )}
                </div>
              </div>

              <ul className="mt-4 divide-y divide-line border-t border-line">
                {statusOrder.map((status) => (
                  <li key={status.value}>
                    <Link
                      href={`/tickets?status=${status.value}`}
                      className="flex items-center justify-between gap-3 px-5 py-2.5 transition-colors duration-150 hover:bg-surface-2"
                    >
                      <span className="flex items-center gap-2.5 text-[13px] text-body">
                        <span
                          aria-hidden="true"
                          className={`h-2 w-2 rounded-full ${statusDotClass(status.value)}`}
                        />
                        {status.label}
                      </span>
                      <span className="text-[13px] font-semibold text-ink tabular-nums">
                        {counts[status.value] ?? 0}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card flush>
            <div className="flex items-center justify-between gap-3 px-5 py-4">
              <h2 className="h3">Active projects</h2>
              <Link href="/projects" className="link text-[13px]">
                All ({activeProjects.length})
              </Link>
            </div>
            {activeProjects.length === 0 ? (
              <p className="border-t border-line px-5 py-5 text-[13px] text-muted">
                No active projects. Add one to start documenting work.
              </p>
            ) : (
              <ul className="divide-y divide-line border-t border-line">
                {activeProjects.slice(0, 4).map((project) => (
                  <li key={project.id}>
                    <Link
                      href={`/projects/${project.id}`}
                      className="flex items-center justify-between gap-3 px-5 py-3 transition-colors duration-150 hover:bg-surface-2"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-[13.5px] font-medium text-ink">
                          {project.name}
                        </span>
                        <span className="mt-0.5 block truncate text-[12px] text-subtle">
                          {project.general_contractor ?? project.site_address ?? 'Jobsite'}
                        </span>
                      </span>
                      <ArrowRight size={14} className="shrink-0 text-faint" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card flush>
            <h2 className="h3 px-5 py-4">Activity</h2>
            {recentActivityRes.data?.length ? (
              <ul className="divide-y divide-line border-t border-line">
                {recentActivityRes.data.map((event) => (
                  <li key={event.id} className="flex gap-3 px-5 py-3">
                    <span className="mt-1.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-700">
                      <TrendingUp size={12} aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] leading-5 text-body">{event.description}</span>
                      <span className="mt-0.5 block text-[11px] text-subtle">
                        {formatRelative(event.created_at)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="border-t border-line px-5 py-5 text-[13px] text-muted">
                Ticket, project and evidence activity will appear here as your team works.
              </p>
            )}
          </Card>
        </div>
      </div>

      <p className="rounded-xl border border-line bg-surface-2/70 px-4 py-3 text-[12px] leading-5 text-muted">
        <strong className="font-semibold text-body">Tracking disclaimer:</strong> totals are
        calculated from the entries your team records, and statuses such as “Approved” are internal
        workflow labels. They are not customer sign-off, a verified change order, or a payment
        guarantee.
      </p>
    </div>
  );
}
