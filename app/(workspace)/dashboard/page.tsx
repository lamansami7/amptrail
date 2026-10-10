import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BriefcaseBusiness, CheckCircle2, ClipboardList, Clock3, Plus, Sparkles } from 'lucide-react';
import { requireWorkspace } from '@/lib/data/workspace';
import { PageHeader, SectionHeading, DataSetupMessage, EmptyState } from '@/components/workspace/app-page';
import { ButtonLink } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/utils';
import { calculateTicketTotals } from '@/lib/tickets/totals';
import { StatusBadge } from '@/components/workspace/status-badge';

export const metadata: Metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  const { supabase, user, workspace } = await requireWorkspace();
  const [activeProjects, draftTickets, reviewTickets, approvedTickets, recentTickets, recentActivity] = await Promise.all([
    supabase.from('projects').select('id', { count: 'exact', head: true }).eq('company_id', workspace.id).eq('is_archived', false),
    supabase.from('work_tickets').select('id', { count: 'exact', head: true }).eq('company_id', workspace.id).eq('status', 'draft'),
    supabase.from('work_tickets').select('id', { count: 'exact', head: true }).eq('company_id', workspace.id).in('status', ['ready_for_review', 'submitted']),
    supabase.from('work_tickets').select('id', { count: 'exact', head: true }).eq('company_id', workspace.id).eq('status', 'approved'),
    supabase.from('work_tickets').select('id, project_id, ticket_number, description, status, occurred_at').eq('company_id', workspace.id).order('updated_at', { ascending: false }).limit(5),
    supabase.from('activity_events').select('id, event_type, entity_type, entity_id, description, created_at').eq('company_id', workspace.id).order('created_at', { ascending: false }).limit(6),
  ]);
  if (activeProjects.error || draftTickets.error || reviewTickets.error || approvedTickets.error || recentTickets.error || recentActivity.error) {
    return <><PageHeader title="Overview" description="A current view of your field records." /><DataSetupMessage /></>;
  }

  const tickets = recentTickets.data || [];
  const projectIds = Array.from(new Set(tickets.map((ticket) => ticket.project_id)));
  const ticketIds = tickets.map((ticket) => ticket.id);
  const [{ data: projects, error: projectError }, { data: labor, error: laborError }, { data: materials, error: materialError }, { data: costs, error: costError }] = await Promise.all([
    projectIds.length ? supabase.from('projects').select('id, name').eq('company_id', workspace.id).in('id', projectIds) : Promise.resolve({ data: [], error: null }),
    ticketIds.length ? supabase.from('labor_entries').select('ticket_id, hours, rate').eq('company_id', workspace.id).in('ticket_id', ticketIds) : Promise.resolve({ data: [], error: null }),
    ticketIds.length ? supabase.from('material_entries').select('ticket_id, quantity, unit_cost').eq('company_id', workspace.id).in('ticket_id', ticketIds) : Promise.resolve({ data: [], error: null }),
    ticketIds.length ? supabase.from('ticket_costs').select('ticket_id, quantity, unit_cost').eq('company_id', workspace.id).in('ticket_id', ticketIds) : Promise.resolve({ data: [], error: null }),
  ]);
  if (projectError || laborError || materialError || costError) return <><PageHeader title="Overview" /><DataSetupMessage /></>;
  const projectMap = new Map((projects || []).map((project) => [project.id, project.name]));
  const firstName = user.user_metadata?.full_name?.split(' ')[0] || 'there';
  const stats = [
    { label: 'Open projects', value: activeProjects.count || 0, icon: BriefcaseBusiness, tone: 'bg-sky-50 text-sky-700' },
    { label: 'Draft tickets', value: draftTickets.count || 0, icon: ClipboardList, tone: 'bg-slate-100 text-slate-700' },
    { label: 'Awaiting review', value: reviewTickets.count || 0, icon: Clock3, tone: 'bg-amber-50 text-amber-800' },
    { label: 'Marked approved', value: approvedTickets.count || 0, icon: CheckCircle2, tone: 'bg-emerald-50 text-emerald-800' },
  ];

  return <>
    <PageHeader eyebrow="Your field workspace" title={`Good to see you, ${firstName}.`} description="A current snapshot of projects and work records in your workspace." action={<ButtonLink href={activeProjects.count ? '/tickets/new' : '/projects/new'}><Plus size={17} />{activeProjects.count ? 'Create work ticket' : 'Create first project'}</ButtonLink>} />
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{stats.map(({ label, value, icon: Icon, tone }) => <article key={label} className="rounded-2xl border border-line bg-white p-4 shadow-card sm:p-5"><div className="flex items-center justify-between"><p className="text-xs font-semibold text-muted">{label}</p><span className={`grid h-9 w-9 place-items-center rounded-xl ${tone}`}><Icon size={17} /></span></div><p className="mt-4 text-3xl font-extrabold tracking-[-0.04em] text-ink">{value}</p></article>)}</div>

    <div className="mt-7 grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)]">
      <section className="rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6">
        <SectionHeading title="Recent work tickets" action={<Link href="/tickets" className="text-xs font-bold text-orange-dark hover:underline">All tickets <ArrowRight size={13} className="inline" /></Link>} />
        {!tickets.length ? <div className="py-6"><EmptyState icon={<ClipboardList size={21} />} title="No work tickets yet" description={activeProjects.count ? 'Capture the next extra-work moment while the details are fresh.' : 'Add a project first, then create a field record for extra work.'} action={<ButtonLink href={activeProjects.count ? '/tickets/new' : '/projects/new'}><Plus size={15} />{activeProjects.count ? 'Create a work ticket' : 'Create a project'}</ButtonLink>} /></div> : <div className="divide-y divide-line">{tickets.map((ticket) => {
          const projectName = projectMap.get(ticket.project_id) || 'Project';
          const total = calculateTicketTotals({ labor: (labor || []).filter((row) => row.ticket_id === ticket.id), materials: (materials || []).filter((row) => row.ticket_id === ticket.id), costs: (costs || []).filter((row) => row.ticket_id === ticket.id) }).total;
          return <Link key={ticket.id} href={`/tickets/${ticket.id}`} className="flex flex-col gap-2 py-4 first:pt-1 last:pb-1 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="font-mono text-xs font-bold text-orange-dark">{ticket.ticket_number}</span><span className="text-xs text-muted">{formatDate(ticket.occurred_at)}</span></div><p className="mt-1 truncate text-sm font-semibold text-ink">{ticket.description}</p><p className="mt-1 text-xs text-muted">{projectName}</p></div><div className="flex items-center justify-between gap-3 sm:justify-end"><StatusBadge status={ticket.status} /><span className="text-sm font-bold text-ink">{formatCurrency(total)}</span></div></Link>;
        })}</div>}
      </section>

      <div className="space-y-5">
        <section className="rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6"><SectionHeading title="Recent activity" />{!recentActivity.data?.length ? <div className="rounded-xl bg-canvas p-4"><span className="inline-flex items-center gap-2 text-sm font-semibold text-ink"><Sparkles size={16} className="text-orange" />Your record starts here</span><p className="mt-2 text-xs leading-5 text-muted">When projects and tickets are created, their recent activity will appear here.</p></div> : <ul className="space-y-4">{recentActivity.data.map((event) => <li key={event.id} className="flex gap-3"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-orange" /><div><p className="text-sm font-medium leading-5 text-ink">{event.description}</p><p className="mt-1 text-[11px] text-muted">{formatDate(event.created_at, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</p></div></li>)}</ul>}</section>
        <section className="rounded-2xl bg-navy p-5 text-white sm:p-6"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/50">Keep it close to the work</p><h2 className="mt-2 text-lg font-bold">A field note, before it fades.</h2><p className="mt-2 text-xs leading-5 text-white/65">Start with a project. Add the time, materials, or photos that make the record useful.</p><Link href={activeProjects.count ? '/evidence' : '/projects/new'} className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-orange">{activeProjects.count ? 'Add evidence' : 'Create a project'} <ArrowRight size={14} /></Link></section>
      </div>
    </div>
    <p className="mt-6 text-xs leading-5 text-muted">Statuses such as “Approved” are team tracking labels. AmpTrail does not verify customer approvals or payments.</p>
  </>;
}
