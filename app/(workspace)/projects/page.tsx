import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Briefcase,
  Building2,
  FolderPlus,
  MapPin,
  Plus,
  Receipt,
  Search,
  Tag,
  TrendingUp,
} from 'lucide-react';
import { requireWorkspace } from '@/lib/data/workspace';
import { PageHeader, EmptyState, DataSetupMessage } from '@/components/workspace/app-page';
import { ButtonLink } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { calculateTicketTotals } from '@/lib/tickets/totals';

export const metadata: Metadata = { title: 'Projects' };

type Props = {
  searchParams: Promise<{ tab?: string; q?: string }>;
};

export default async function ProjectsPage({ searchParams }: Props) {
  const params = await searchParams;
  const currentTab = params.tab === 'archived' ? 'archived' : 'active';
  const searchQuery = (params.q || '').trim().toLowerCase();

  const { supabase, workspace } = await requireWorkspace();

  const [projectsRes, ticketsRes, laborRes, materialsRes, costsRes] = await Promise.all([
    supabase
      .from('projects')
      .select('id, name, project_number, site_address, general_contractor, notes, is_archived, created_at, updated_at')
      .eq('company_id', workspace.id)
      .order('updated_at', { ascending: false }),
    supabase
      .from('work_tickets')
      .select('id, project_id, status')
      .eq('company_id', workspace.id),
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

  if (projectsRes.error || ticketsRes.error) {
    return (
      <>
        <PageHeader title="Projects" description="Keep job details and extra-work records together." />
        <DataSetupMessage />
      </>
    );
  }

  const projects = projectsRes.data || [];
  const tickets = ticketsRes.data || [];
  const labor = laborRes.data || [];
  const materials = materialsRes.data || [];
  const costs = costsRes.data || [];

  // Pre-calculate per-ticket totals
  const ticketTotals = new Map<string, number>();
  for (const t of tickets) {
    const tLabor = labor.filter((l) => l.ticket_id === t.id).map((l) => ({ hours: Number(l.hours), rate: Number(l.rate) }));
    const tMat = materials.filter((m) => m.ticket_id === t.id).map((m) => ({ quantity: Number(m.quantity), unit_cost: Number(m.unit_cost) }));
    const tCost = costs.filter((c) => c.ticket_id === t.id).map((c) => ({ quantity: Number(c.quantity), unit_cost: Number(c.unit_cost) }));
    ticketTotals.set(t.id, calculateTicketTotals({ labor: tLabor, materials: tMat, costs: tCost }).total);
  }

  // Aggregate stats per project
  const projectStats = new Map<string, { ticketCount: number; documentedTotal: number }>();
  for (const p of projects) {
    const pTickets = tickets.filter((t) => t.project_id === p.id);
    const pTotal = pTickets.reduce((sum, t) => sum + (ticketTotals.get(t.id) || 0), 0);
    projectStats.set(p.id, { ticketCount: pTickets.length, documentedTotal: pTotal });
  }

  const activeProjects = projects.filter((p) => !p.is_archived);
  const archivedProjects = projects.filter((p) => p.is_archived);

  const displayedList = currentTab === 'archived' ? archivedProjects : activeProjects;
  const filteredProjects = displayedList.filter((p) => {
    if (!searchQuery) return true;
    return (
      p.name.toLowerCase().includes(searchQuery) ||
      (p.project_number && p.project_number.toLowerCase().includes(searchQuery)) ||
      (p.general_contractor && p.general_contractor.toLowerCase().includes(searchQuery)) ||
      (p.site_address && p.site_address.toLowerCase().includes(searchQuery))
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Commercial Jobs"
        title="Projects"
        description="Organize work tickets, jobsite photos, and documented extra costs by customer job."
        action={
          <ButtonLink href="/projects/new">
            <Plus size={16} strokeWidth={2.5} />
            <span>New Project</span>
          </ButtonLink>
        }
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Tabs */}
        <div className="flex items-center rounded-xl border border-slate-200 bg-white p-1 shadow-xs">
          <Link
            href={`/projects?tab=active${searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ''}`}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
              currentTab === 'active'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Active ({activeProjects.length})
          </Link>
          <Link
            href={`/projects?tab=archived${searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ''}`}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
              currentTab === 'archived'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Archived ({archivedProjects.length})
          </Link>
        </div>

        {/* Search */}
        <form action="/projects" className="relative w-full sm:max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="field-control min-h-10 py-1.5 pl-9 text-xs sm:text-sm"
            type="search"
            name="q"
            defaultValue={params.q}
            placeholder="Search name, GC, site or number..."
            aria-label="Search projects"
          />
          {currentTab === 'archived' && <input type="hidden" name="tab" value="archived" />}
        </form>
      </div>

      {/* Projects Grid */}
      {!projects.length ? (
        <EmptyState
          icon={<Briefcase size={22} />}
          title="No projects in this workspace"
          description="Create your first commercial electrical project with its job number, jobsite location, and general contractor."
          action={
            <ButtonLink href="/projects/new">
              <FolderPlus size={16} /> Create Your First Project
            </ButtonLink>
          }
        />
      ) : !filteredProjects.length ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <p className="font-bold text-slate-900">No matching projects found</p>
          <p className="mt-1 text-xs text-slate-500">
            {searchQuery
              ? `No projects matched "${searchQuery}". Try a different keyword.`
              : currentTab === 'archived'
              ? 'There are no archived projects in your workspace.'
              : 'There are no active projects. Check the archived tab.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => {
            const stats = projectStats.get(project.id) || { ticketCount: 0, documentedTotal: 0 };
            return (
              <div
                key={project.id}
                className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition hover:border-slate-300 hover:shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-600/10">
                      <Briefcase size={18} />
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        project.is_archived
                          ? 'bg-slate-100 text-slate-600'
                          : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80'
                      }`}
                    >
                      {project.is_archived ? 'Archived' : 'Active'}
                    </span>
                  </div>

                  <Link href={`/projects/${project.id}`} className="mt-4 block">
                    <h2 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition">
                      {project.name}
                    </h2>
                  </Link>

                  <div className="mt-3 space-y-1.5 text-xs text-slate-500">
                    {project.project_number && (
                      <div className="flex items-center gap-1.5">
                        <Tag size={13} className="text-slate-400" />
                        <span>Job #: {project.project_number}</span>
                      </div>
                    )}
                    {project.general_contractor && (
                      <div className="flex items-center gap-1.5">
                        <Building2 size={13} className="text-slate-400" />
                        <span className="truncate">GC: {project.general_contractor}</span>
                      </div>
                    )}
                    {project.site_address && (
                      <div className="flex items-center gap-1.5">
                        <MapPin size={13} className="text-slate-400 shrink-0" />
                        <span className="truncate">{project.site_address}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer: Metrics & Links */}
                <div className="mt-5 border-t border-slate-100 pt-4">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Receipt size={14} className="text-slate-400" />
                      <span className="font-semibold">{stats.ticketCount}</span>
                      <span className="text-slate-400">ticket{stats.ticketCount === 1 ? '' : 's'}</span>
                    </div>

                    <div className="flex items-center gap-1 text-slate-900 font-mono font-bold">
                      <TrendingUp size={13} className="text-blue-600" />
                      <span>{formatCurrency(stats.documentedTotal)}</span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2 pt-2">
                    <Link
                      href={`/projects/${project.id}`}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      View Details →
                    </Link>
                    {!project.is_archived && (
                      <Link
                        href={`/tickets/new?projectId=${project.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100"
                      >
                        <Plus size={12} />
                        New Ticket
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
