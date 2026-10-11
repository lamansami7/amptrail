import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  Briefcase,
  CheckCircle2,
  FolderPlus,
  Plus,
  Receipt,
  Camera,
  AlertCircle,
  TrendingUp,
  FileClock,
} from 'lucide-react';
import { requireWorkspace } from '@/lib/data/workspace';
import { PageHeader, SectionHeading, DataSetupMessage, EmptyState } from '@/components/workspace/app-page';
import { ButtonLink } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/utils';
import { calculateTicketTotals } from '@/lib/tickets/totals';
import { StatusBadge } from '@/components/workspace/status-badge';

export const metadata: Metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  const { supabase, user, workspace } = await requireWorkspace();

  // Fetch all counts, recent tickets, recent activity, and active projects in parallel
  const [
    projectsRes,
    allTicketsRes,
    recentTicketsRes,
    recentActivityRes,
    allLaborRes,
    allMaterialsRes,
    allCostsRes,
  ] = await Promise.all([
    supabase
      .from('projects')
      .select('id, name, project_number, site_address, general_contractor, is_archived, updated_at')
      .eq('company_id', workspace.id)
      .order('updated_at', { ascending: false }),
    supabase
      .from('work_tickets')
      .select('id, status')
      .eq('company_id', workspace.id),
    supabase
      .from('work_tickets')
      .select('id, project_id, ticket_number, description, status, occurred_at, updated_at')
      .eq('company_id', workspace.id)
      .order('updated_at', { ascending: false })
      .limit(6),
    supabase
      .from('activity_events')
      .select('id, event_type, entity_type, entity_id, description, created_at')
      .eq('company_id', workspace.id)
      .order('created_at', { ascending: false })
      .limit(6),
    supabase
      .from('labor_entries')
      .select('ticket_id, hours, rate')
      .eq('company_id', workspace.id),
    supabase
      .from('material_entries')
      .select('ticket_id, quantity, unit_cost')
      .eq('company_id', workspace.id),
    supabase
      .from('ticket_costs')
      .select('ticket_id, quantity, unit_cost')
      .eq('company_id', workspace.id),
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
      <>
        <PageHeader title="Overview" description="A current view of your field records." />
        <DataSetupMessage />
      </>
    );
  }

  const allProjects = projectsRes.data || [];
  const activeProjects = allProjects.filter((p) => !p.is_archived);
  const allTickets = allTicketsRes.data || [];

  // Status counts
  const draftCount = allTickets.filter((t) => t.status === 'draft').length;
  const reviewCount = allTickets.filter((t) => t.status === 'ready_for_review').length;
  const submittedCount = allTickets.filter((t) => t.status === 'submitted').length;
  const approvedCount = allTickets.filter((t) => t.status === 'approved').length;
  const invoicedCount = allTickets.filter((t) => t.status === 'invoiced').length;
  const rejectedCount = allTickets.filter((t) => t.status === 'rejected').length;
  const openCount = draftCount + reviewCount + submittedCount;

  // Workspace-wide documented total calculation
  const workspaceTotals = calculateTicketTotals({
    labor: (allLaborRes.data || []).map((l) => ({ hours: Number(l.hours), rate: Number(l.rate) })),
    materials: (allMaterialsRes.data || []).map((m) => ({ quantity: Number(m.quantity), unit_cost: Number(m.unit_cost) })),
    costs: (allCostsRes.data || []).map((c) => ({ quantity: Number(c.quantity), unit_cost: Number(c.unit_cost) })),
  });

  // Map project names
  const projectMap = new Map(allProjects.map((p) => [p.id, p]));

  // Calculate totals for recent tickets
  const recentTickets = recentTicketsRes.data || [];
  const laborRows = allLaborRes.data || [];
  const materialRows = allMaterialsRes.data || [];
  const costRows = allCostsRes.data || [];

  const ticketTotals = new Map<string, number>();
  for (const t of recentTickets) {
    const tTotal = calculateTicketTotals({
      labor: laborRows.filter((r) => r.ticket_id === t.id).map((r) => ({ hours: Number(r.hours), rate: Number(r.rate) })),
      materials: materialRows.filter((r) => r.ticket_id === t.id).map((r) => ({ quantity: Number(r.quantity), unit_cost: Number(r.unit_cost) })),
      costs: costRows.filter((r) => r.ticket_id === t.id).map((r) => ({ quantity: Number(r.quantity), unit_cost: Number(r.unit_cost) })),
    }).total;
    ticketTotals.set(t.id, tTotal);
  }

  // Attention needed items
  const attentionItems: Array<{ title: string; count: number; href: string; tone: string }> = [];
  if (draftCount > 0) {
    attentionItems.push({
      title: `${draftCount} draft ticket${draftCount === 1 ? '' : 's'} waiting for review`,
      count: draftCount,
      href: '/tickets?status=draft',
      tone: 'border-slate-300 bg-slate-50 text-slate-800',
    });
  }
  if (reviewCount > 0) {
    attentionItems.push({
      title: `${reviewCount} ticket${reviewCount === 1 ? '' : 's'} ready for customer submission`,
      count: reviewCount,
      href: '/tickets?status=ready_for_review',
      tone: 'border-amber-200 bg-amber-50/80 text-amber-900',
    });
  }

  const firstName = user.user_metadata?.full_name?.split(' ')[0] || 'there';
  const hasContent = allProjects.length > 0 || allTickets.length > 0;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Field Command Center</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Welcome back, {firstName}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Real-time tracking of documented extra work, jobsite projects, and field evidence.
          </p>
        </div>

        {/* Quick Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <ButtonLink
            href={activeProjects.length ? '/tickets/new' : '/projects/new'}
            className="shadow-sm"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>{activeProjects.length ? 'New Work Ticket' : 'Create First Project'}</span>
          </ButtonLink>
          <ButtonLink href="/projects/new" variant="secondary">
            <FolderPlus size={15} />
            <span>New Project</span>
          </ButtonLink>
          <ButtonLink href="/evidence" variant="secondary" className="hidden sm:inline-flex">
            <Camera size={15} />
            <span>Upload Evidence</span>
          </ButtonLink>
        </div>
      </div>

      {/* Onboarding State if totally empty */}
      {!hasContent && (
        <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/70 via-white to-slate-50 p-6 sm:p-8">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-600/10 px-3 py-1 text-xs font-bold text-blue-700">
              Getting Started with AmpTrail
            </span>
            <h2 className="mt-3 text-xl font-bold text-slate-900 sm:text-2xl">
              Set up your first job in less than 2 minutes.
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              AmpTrail protects your margins by making extra work simple to capture in the field before details get lost. Start by adding your first project, then document time and materials on a work ticket.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink href="/projects/new">
                <Plus size={16} /> Create Your First Project
              </ButtonLink>
              <ButtonLink href="/contact" variant="secondary">
                Learn Best Practices
              </ButtonLink>
            </div>
          </div>
        </div>
      )}

      {/* Primary Metrics Grid */}
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Documented Work Value */}
        <div className="card relative overflow-hidden p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Documented Work Value
            </p>
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-blue-600">
              <TrendingUp size={18} />
            </span>
          </div>
          <p className="mt-3 font-mono text-2xl font-black tracking-tight text-slate-900 sm:text-3xl tabular-nums">
            {formatCurrency(workspaceTotals.total)}
          </p>
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs text-slate-500">
            <span>Labor: {formatCurrency(workspaceTotals.labor)}</span>
            <span>Mat/Other: {formatCurrency(workspaceTotals.materials + workspaceTotals.other)}</span>
          </div>
        </div>

        {/* Active Projects */}
        <div className="card p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Active Projects
            </p>
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-sky-50 text-sky-700">
              <Briefcase size={18} />
            </span>
          </div>
          <p className="mt-3 font-mono text-2xl font-black tracking-tight text-slate-900 sm:text-3xl tabular-nums">
            {activeProjects.length}
          </p>
          <p className="mt-3 border-t border-slate-100 pt-2.5 text-xs text-slate-500">
            {allProjects.length - activeProjects.length} archived project{allProjects.length - activeProjects.length === 1 ? '' : 's'}
          </p>
        </div>

        {/* Open Work Tickets */}
        <div className="card p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Open Work Tickets
            </p>
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-50 text-amber-700">
              <FileClock size={18} />
            </span>
          </div>
          <p className="mt-3 font-mono text-2xl font-black tracking-tight text-slate-900 sm:text-3xl tabular-nums">
            {openCount}
          </p>
          <p className="mt-3 border-t border-slate-100 pt-2.5 text-xs text-slate-500">
            {draftCount} draft · {reviewCount} ready for review
          </p>
        </div>

        {/* Approved Records */}
        <div className="card p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Marked Approved
            </p>
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
              <CheckCircle2 size={18} />
            </span>
          </div>
          <p className="mt-3 font-mono text-2xl font-black tracking-tight text-slate-900 sm:text-3xl tabular-nums">
            {approvedCount}
          </p>
          <p className="mt-3 border-t border-slate-100 pt-2.5 text-xs text-slate-500">
            {invoicedCount} invoiced · internal team status
          </p>
        </div>
      </div>

      {/* Attention Needed Banner */}
      {attentionItems.length > 0 && (
        <div className="space-y-2">
          {attentionItems.map((item, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-between rounded-xl border px-4 py-3 text-xs sm:text-sm ${item.tone}`}
            >
              <div className="flex items-center gap-2.5">
                <AlertCircle size={16} className="shrink-0" />
                <span className="font-semibold">{item.title}</span>
              </div>
              <Link
                href={item.href}
                className="inline-flex items-center gap-1 font-bold underline underline-offset-2 hover:opacity-80 transition"
              >
                Review tickets <ArrowRight size={13} />
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Ticket Status Breakdown Bar */}
      {allTickets.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Ticket Status Distribution ({allTickets.length} Total)
            </h2>
            <Link href="/tickets" className="text-xs font-bold text-blue-600 hover:underline">
              View all
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {[
              { label: 'Draft', count: draftCount, status: 'draft' },
              { label: 'Ready for Review', count: reviewCount, status: 'ready_for_review' },
              { label: 'Submitted', count: submittedCount, status: 'submitted' },
              { label: 'Approved', count: approvedCount, status: 'approved' },
              { label: 'Invoiced', count: invoicedCount, status: 'invoiced' },
              { label: 'Rejected', count: rejectedCount, status: 'rejected' },
            ].map((item) => (
              <Link
                key={item.status}
                href={`/tickets?status=${item.status}`}
                className="flex flex-col items-center justify-center rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-center transition hover:border-slate-300 hover:bg-white"
              >
                <StatusBadge status={item.status} size="xs" />
                <span className="mt-2 font-mono text-lg font-black text-slate-900 tabular-nums">
                  {item.count}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Two Column Layout: Recent Tickets & Sidebar (Projects + Activity) */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        {/* Left Column: Recent Work Tickets */}
        <div className="card p-5 sm:p-6">
          <SectionHeading
            title="Recent Work Tickets"
            subtitle="Most recently updated field records"
            action={
              <Link
                href="/tickets"
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
              >
                All Tickets <ArrowRight size={13} />
              </Link>
            }
          />

          {!recentTickets.length ? (
            <div className="py-6">
              <EmptyState
                icon={<Receipt size={22} />}
                title="No work tickets recorded yet"
                description={
                  activeProjects.length
                    ? 'Start capturing extra work while crew members are still on site.'
                    : 'Create your first project to connect jobsite work records.'
                }
                action={
                  <ButtonLink href={activeProjects.length ? '/tickets/new' : '/projects/new'}>
                    <Plus size={15} />
                    {activeProjects.length ? 'Create First Ticket' : 'Create Project First'}
                  </ButtonLink>
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200/80 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="pb-3 font-bold">Ticket</th>
                    <th className="pb-3 font-bold">Project</th>
                    <th className="pb-3 font-bold">Status</th>
                    <th className="pb-3 text-right font-bold">Documented Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentTickets.map((ticket) => {
                    const project = projectMap.get(ticket.project_id);
                    const total = ticketTotals.get(ticket.id) || 0;
                    return (
                      <tr
                        key={ticket.id}
                        className="group transition hover:bg-slate-50/80"
                      >
                        <td className="py-3.5 pr-3">
                          <Link href={`/tickets/${ticket.id}`} className="block">
                            <span className="font-mono text-xs font-bold text-blue-600 group-hover:underline">
                              {ticket.ticket_number}
                            </span>
                            <p className="line-clamp-1 max-w-[220px] text-xs font-medium text-slate-800">
                              {ticket.description}
                            </p>
                            <span className="text-[11px] text-slate-400">
                              {formatDate(ticket.occurred_at)}
                            </span>
                          </Link>
                        </td>
                        <td className="py-3.5 pr-3">
                          <Link href={`/projects/${ticket.project_id}`} className="block">
                            <p className="truncate text-xs font-semibold text-slate-700 hover:text-blue-600">
                              {project?.name || 'Project'}
                            </p>
                            {project?.project_number && (
                              <p className="text-[11px] text-slate-400">{project.project_number}</p>
                            )}
                          </Link>
                        </td>
                        <td className="py-3.5 pr-3">
                          <StatusBadge status={ticket.status} size="xs" />
                        </td>
                        <td className="py-3.5 text-right">
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
          )}
        </div>

        {/* Right Column: Active Projects & Activity Feed */}
        <div className="space-y-6">
          {/* Active Projects Quick Access */}
          <div className="card p-5">
            <SectionHeading
              title="Active Projects"
              action={
                <Link
                  href="/projects"
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  All ({activeProjects.length})
                </Link>
              }
            />
            {!activeProjects.length ? (
              <p className="py-2 text-xs text-slate-500">No active projects found.</p>
            ) : (
              <div className="space-y-2.5">
                {activeProjects.slice(0, 4).map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-3 transition hover:border-slate-300 hover:bg-white"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-slate-900">{project.name}</p>
                      <p className="truncate text-[11px] text-slate-500">
                        {project.general_contractor || project.site_address || 'Jobsite'}
                      </p>
                    </div>
                    <ArrowRight size={14} className="shrink-0 text-slate-400" />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity Feed */}
          <div className="card p-5">
            <SectionHeading title="Recent Workspace Activity" />
            {!recentActivityRes.data?.length ? (
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-center text-xs text-slate-500">
                Activity will be tracked here as tickets, projects, and evidence are recorded.
              </div>
            ) : (
              <ul className="space-y-3.5">
                {recentActivityRes.data.map((event) => (
                  <li key={event.id} className="flex gap-3 text-xs">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-800 leading-snug">{event.description}</p>
                      <p className="mt-0.5 text-[10px] text-slate-400">
                        {formatDate(event.created_at, {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Legal / Entitlement Notice */}
          <div className="rounded-2xl border border-slate-200/80 bg-slate-100/70 p-4 text-[11px] leading-5 text-slate-500">
            <p className="font-bold text-slate-700">Documentation & Tracking Disclaimer</p>
            <p className="mt-1">
              Documented values are calculated from field entries. Statuses like “Approved” are internal workflow labels and do not constitute customer signoff, verified change orders, or guaranteed payment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
