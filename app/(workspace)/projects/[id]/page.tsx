import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  CalendarDays,
  Camera,
  ClipboardList,
  Edit3,
  MapPin,
  Plus,
  Receipt,
  Tag,
  TrendingUp,
  Building2,
  FileText,
} from 'lucide-react';
import { requireWorkspace } from '@/lib/data/workspace';
import { formatCurrency, formatDate } from '@/lib/utils';
import { calculateTicketTotals } from '@/lib/tickets/totals';
import { DataSetupMessage, EmptyState } from '@/components/workspace/app-page';
import { ButtonLink } from '@/components/ui/button';
import { StatusBadge } from '@/components/workspace/status-badge';
import { ConfirmActionForm } from '@/components/forms/confirm-action-form';
import { archiveProjectAction } from '@/lib/actions/projects';

export const metadata: Metadata = { title: 'Project Details' };

type Props = { params: Promise<{ id: string }> };

export default async function ProjectDetailPage({ params }: Props) {
  const { id } = await params;
  const { supabase, workspace } = await requireWorkspace();

  const { data: project, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .eq('company_id', workspace.id)
    .maybeSingle();

  if (error) return <DataSetupMessage />;
  if (!project) notFound();

  // Fetch tickets, evidence, and line items for this project
  const [ticketsRes, evidenceRes] = await Promise.all([
    supabase
      .from('work_tickets')
      .select('id, ticket_number, description, status, occurred_at, updated_at')
      .eq('project_id', project.id)
      .eq('company_id', workspace.id)
      .order('occurred_at', { ascending: false })
      .limit(100),
    supabase
      .from('evidence_files')
      .select('id, original_filename, caption, storage_path, mime_type, size_bytes, created_at')
      .eq('project_id', project.id)
      .eq('company_id', workspace.id)
      .order('created_at', { ascending: false })
      .limit(12),
  ]);

  if (ticketsRes.error) return <DataSetupMessage />;

  const tickets = ticketsRes.data || [];
  const ticketIds = tickets.map((t) => t.id);

  // Fetch costs for these tickets
  const [laborRes, materialsRes, costsRes] = await Promise.all([
    ticketIds.length
      ? supabase.from('labor_entries').select('ticket_id, hours, rate').eq('company_id', workspace.id).in('ticket_id', ticketIds)
      : Promise.resolve({ data: [], error: null }),
    ticketIds.length
      ? supabase.from('material_entries').select('ticket_id, quantity, unit_cost').eq('company_id', workspace.id).in('ticket_id', ticketIds)
      : Promise.resolve({ data: [], error: null }),
    ticketIds.length
      ? supabase.from('ticket_costs').select('ticket_id, quantity, unit_cost').eq('company_id', workspace.id).in('ticket_id', ticketIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const laborRows = laborRes.data || [];
  const materialRows = materialsRes.data || [];
  const costRows = costsRes.data || [];

  const ticketTotals = new Map<string, number>();
  for (const t of tickets) {
    const tTotal = calculateTicketTotals({
      labor: laborRows.filter((l) => l.ticket_id === t.id).map((l) => ({ hours: Number(l.hours), rate: Number(l.rate) })),
      materials: materialRows.filter((m) => m.ticket_id === t.id).map((m) => ({ quantity: Number(m.quantity), unit_cost: Number(m.unit_cost) })),
      costs: costRows.filter((c) => c.ticket_id === t.id).map((c) => ({ quantity: Number(c.quantity), unit_cost: Number(c.unit_cost) })),
    }).total;
    ticketTotals.set(t.id, tTotal);
  }

  // Calculate project aggregate financials
  const projectTotals = calculateTicketTotals({
    labor: laborRows.map((l) => ({ hours: Number(l.hours), rate: Number(l.rate) })),
    materials: materialRows.map((m) => ({ quantity: Number(m.quantity), unit_cost: Number(m.unit_cost) })),
    costs: costRows.map((c) => ({ quantity: Number(c.quantity), unit_cost: Number(c.unit_cost) })),
  });

  // Get signed URLs for evidence preview if available
  const evidenceFiles = evidenceRes.data || [];
  const signedEvidence = evidenceFiles.length
    ? await supabase.storage.from('evidence').createSignedUrls(evidenceFiles.map((e) => e.storage_path), 3600)
    : { data: [], error: null };
  const signedUrlMap = new Map((signedEvidence.data || []).map((item) => [item.path || '', item.signedUrl]));

  return (
    <div className="space-y-6">
      {/* Navigation bar & Top actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/projects"
          className="inline-flex min-h-9 items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft size={15} /> All Projects
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <ButtonLink href={`/projects/${project.id}/edit`} variant="secondary">
            <Edit3 size={15} /> Edit Project
          </ButtonLink>
          {!project.is_archived && (
            <ButtonLink href={`/tickets/new?projectId=${project.id}`}>
              <Plus size={16} strokeWidth={2.5} /> Create Work Ticket
            </ButtonLink>
          )}
        </div>
      </div>

      {/* Project Overview Card */}
      <div className="card p-6 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="eyebrow">Project Overview</span>
              {project.project_number && (
                <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold text-slate-700">
                  <Tag size={12} className="text-slate-400" />
                  {project.project_number}
                </span>
              )}
            </div>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              {project.name}
            </h1>
          </div>
          <div>
            {project.is_archived ? (
              <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-600">
                Archived Project
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Active Project
              </span>
            )}
          </div>
        </div>

        {/* Project Metadata Grid */}
        <div className="mt-6 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Jobsite Address
            </p>
            <p className="mt-1 flex items-start gap-1.5 text-xs font-semibold text-slate-800">
              <MapPin size={15} className="mt-0.5 shrink-0 text-blue-600" />
              <span>{project.site_address || 'Not specified'}</span>
            </p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              General Contractor
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-800">
              <Building2 size={15} className="shrink-0 text-blue-600" />
              <span>{project.general_contractor || 'Not specified'}</span>
            </p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Project Created
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-800">
              <CalendarDays size={15} className="shrink-0 text-blue-600" />
              <span>{formatDate(project.created_at)}</span>
            </p>
          </div>
        </div>

        {/* Project Notes */}
        {project.notes && (
          <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50/70 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Project Scope Notes
            </p>
            <p className="mt-1 whitespace-pre-wrap text-xs leading-6 text-slate-700">
              {project.notes}
            </p>
          </div>
        )}

        {/* Bottom Actions & Status toggle */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 text-xs">
          <ConfirmActionForm
            action={archiveProjectAction}
            id={project.id}
            extra={{ archived: project.is_archived ? 'false' : 'true' }}
            label={project.is_archived ? 'Restore this project' : 'Archive project'}
            message={
              project.is_archived
                ? 'Restore this project so field crew can create new tickets?'
                : 'Archive this project? Existing tickets and evidence remain preserved, but new tickets cannot be created until it is restored.'
            }
            variant="quiet"
          />
          <p className="text-slate-500">
            {tickets.length} documented work ticket{tickets.length === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      {/* Project Financial Summary */}
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Documented Work Total
            </p>
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-50 text-blue-600">
              <TrendingUp size={16} />
            </span>
          </div>
          <p className="mt-3 font-mono text-2xl font-black text-slate-900 tabular-nums">
            {formatCurrency(projectTotals.total)}
          </p>
          <p className="mt-2 text-[11px] text-slate-400">
            Across {tickets.length} extra work ticket{tickets.length === 1 ? '' : 's'}
          </p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Labor Subtotal
            </p>
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-slate-700">
              <Receipt size={16} />
            </span>
          </div>
          <p className="mt-3 font-mono text-2xl font-black text-slate-900 tabular-nums">
            {formatCurrency(projectTotals.labor)}
          </p>
          <p className="mt-2 text-[11px] text-slate-400">{laborRows.length} labor entries</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Materials Subtotal
            </p>
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-slate-700">
              <FileText size={16} />
            </span>
          </div>
          <p className="mt-3 font-mono text-2xl font-black text-slate-900 tabular-nums">
            {formatCurrency(projectTotals.materials)}
          </p>
          <p className="mt-2 text-[11px] text-slate-400">{materialRows.length} material lines</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Other & Equipment
            </p>
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-slate-700">
              <TrendingUp size={16} />
            </span>
          </div>
          <p className="mt-3 font-mono text-2xl font-black text-slate-900 tabular-nums">
            {formatCurrency(projectTotals.other)}
          </p>
          <p className="mt-2 text-[11px] text-slate-400">{costRows.length} cost entries</p>
        </div>
      </div>

      {/* Work Tickets Table */}
      <section className="card p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Project Work Tickets</h2>
            <p className="text-xs text-slate-500">All field records tied to this job</p>
          </div>
          {!project.is_archived && (
            <ButtonLink href={`/tickets/new?projectId=${project.id}`} variant="secondary">
              <Plus size={15} /> New Ticket
            </ButtonLink>
          )}
        </div>

        {!tickets.length ? (
          <EmptyState
            icon={<ClipboardList size={22} />}
            title="No tickets for this project yet"
            description="When extra work or field changes happen, create a work ticket to document labor, materials, and photos."
            action={
              !project.is_archived ? (
                <ButtonLink href={`/tickets/new?projectId=${project.id}`}>
                  <Plus size={15} /> Create First Ticket
                </ButtonLink>
              ) : undefined
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200/80 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="pb-3 font-bold">Ticket #</th>
                  <th className="pb-3 font-bold">Date</th>
                  <th className="pb-3 font-bold">Work Description</th>
                  <th className="pb-3 font-bold">Status</th>
                  <th className="pb-3 text-right font-bold">Documented Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tickets.map((t) => (
                  <tr key={t.id} className="group transition hover:bg-slate-50/80">
                    <td className="py-3.5 pr-3">
                      <Link
                        href={`/tickets/${t.id}`}
                        className="font-mono text-xs font-bold text-blue-600 group-hover:underline"
                      >
                        {t.ticket_number}
                      </Link>
                    </td>
                    <td className="py-3.5 pr-3 text-xs text-slate-500 whitespace-nowrap">
                      {formatDate(t.occurred_at)}
                    </td>
                    <td className="py-3.5 pr-3">
                      <Link href={`/tickets/${t.id}`} className="block">
                        <p className="line-clamp-2 max-w-md text-xs font-medium text-slate-800">
                          {t.description}
                        </p>
                      </Link>
                    </td>
                    <td className="py-3.5 pr-3">
                      <StatusBadge status={t.status} size="xs" />
                    </td>
                    <td className="py-3.5 text-right font-mono text-xs font-bold text-slate-900 tabular-nums">
                      {formatCurrency(ticketTotals.get(t.id) || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Supporting Evidence Gallery */}
      <section className="card p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Jobsite Evidence</h2>
            <p className="text-xs text-slate-500">Photos and field notes captured for this project</p>
          </div>
          <ButtonLink href="/evidence" variant="secondary">
            <Camera size={15} /> Upload Photo
          </ButtonLink>
        </div>

        {!evidenceFiles.length ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center text-xs text-slate-500">
            No photo evidence uploaded yet for this project.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {evidenceFiles.map((item) => {
              const url = signedUrlMap.get(item.storage_path);
              return (
                <div
                  key={item.id}
                  className="group relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
                >
                  <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100">
                    {url ? (
                      <img
                        src={url}
                        alt={item.caption || item.original_filename}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="grid h-full place-items-center text-slate-400">
                        <Camera size={18} />
                      </div>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="truncate text-[11px] font-bold text-slate-900">
                      {item.caption || item.original_filename}
                    </p>
                    <p className="text-[10px] text-slate-400">{formatDate(item.created_at)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
