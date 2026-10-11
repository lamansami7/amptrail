import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  FileText,
  MapPin,
  Pencil,
  Plus,
  UserRound,
  Wrench,
  Receipt,
} from 'lucide-react';
import { requireWorkspace } from '@/lib/data/workspace';
import { formatCurrency, formatDate } from '@/lib/utils';
import { calculateTicketTotals } from '@/lib/tickets/totals';
import { DataSetupMessage } from '@/components/workspace/app-page';
import { StatusBadge } from '@/components/workspace/status-badge';
import { ButtonLink } from '@/components/ui/button';
import { duplicateTicketAction } from '@/lib/actions/tickets';
import { DeleteTicketButton } from '@/components/tickets/delete-ticket-button';
import { TicketExport } from '@/components/tickets/ticket-export';
import { EvidencePanel, type EvidenceView } from '@/components/evidence/evidence-panel';

export const metadata: Metadata = { title: 'Work Ticket Details' };

type Props = { params: Promise<{ id: string }> };

export default async function TicketDetailPage({ params }: Props) {
  const { id } = await params;
  const { supabase, user, workspace } = await requireWorkspace();

  const { data: ticket, error } = await supabase
    .from('work_tickets')
    .select('*')
    .eq('id', id)
    .eq('company_id', workspace.id)
    .maybeSingle();

  if (error) return <DataSetupMessage />;
  if (!ticket) notFound();

  const [
    { data: project, error: projectError },
    { data: labor, error: laborError },
    { data: materials, error: materialError },
    { data: costs, error: costError },
    { data: evidence, error: evidenceError },
  ] = await Promise.all([
    supabase
      .from('projects')
      .select('id, name, project_number, site_address, general_contractor, is_archived')
      .eq('id', ticket.project_id)
      .eq('company_id', workspace.id)
      .maybeSingle(),
    supabase
      .from('labor_entries')
      .select('*')
      .eq('ticket_id', ticket.id)
      .eq('company_id', workspace.id)
      .order('created_at'),
    supabase
      .from('material_entries')
      .select('*')
      .eq('ticket_id', ticket.id)
      .eq('company_id', workspace.id)
      .order('created_at'),
    supabase
      .from('ticket_costs')
      .select('*')
      .eq('ticket_id', ticket.id)
      .eq('company_id', workspace.id)
      .order('created_at'),
    supabase
      .from('evidence_files')
      .select('*')
      .eq('ticket_id', ticket.id)
      .eq('company_id', workspace.id)
      .order('created_at', { ascending: false }),
  ]);

  if (projectError || laborError || materialError || costError || evidenceError || !project) {
    return <DataSetupMessage />;
  }

  const evidenceRows = evidence || [];
  const signedEvidence = evidenceRows.length
    ? await supabase.storage.from('evidence').createSignedUrls(evidenceRows.map((item) => item.storage_path), 3600)
    : { data: [], error: null };
  const signedUrlByPath = new Map((signedEvidence.data || []).map((item) => [item.path || '', item.signedUrl]));

  const evidenceWithUrls: EvidenceView[] = evidenceRows.map((item) => ({
    ...item,
    signedUrl: signedUrlByPath.get(item.storage_path) || null,
    canDelete: item.uploaded_by === user.id,
  }));

  const totals = calculateTicketTotals({
    labor: (labor || []).map((l) => ({ hours: Number(l.hours), rate: Number(l.rate) })),
    materials: (materials || []).map((m) => ({ quantity: Number(m.quantity), unit_cost: Number(m.unit_cost) })),
    costs: (costs || []).map((c) => ({ quantity: Number(c.quantity), unit_cost: Number(c.unit_cost) })),
  });

  const canEdit = ticket.created_by === user.id;

  return (
    <div className="print-page space-y-6">
      {/* Top action bar */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/tickets"
          className="inline-flex min-h-9 items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft size={15} /> All Work Tickets
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          {canEdit && (
            <ButtonLink href={`/tickets/${ticket.id}/edit`} variant="secondary">
              <Pencil size={14} /> Edit Ticket
            </ButtonLink>
          )}

          {!project.is_archived ? (
            <form action={duplicateTicketAction}>
              <input type="hidden" name="id" value={ticket.id} />
              <button
                type="submit"
                className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition"
              >
                <Plus size={14} /> Duplicate Ticket
              </button>
            </form>
          ) : (
            <span className="text-xs text-slate-400">Restore project to duplicate</span>
          )}

          {canEdit && ticket.status === 'draft' && (
            <DeleteTicketButton id={ticket.id} ticketNumber={ticket.ticket_number} />
          )}
        </div>
      </div>

      {/* Ticket Header Banner */}
      <header className="card p-6 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="eyebrow">Time & Material Work Record</span>
              <span className="font-mono text-xs font-bold text-slate-400">
                Created {formatDate(ticket.created_at)}
              </span>
            </div>
            <h1 className="mt-2 font-mono text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              {ticket.ticket_number}
            </h1>
            <p className="mt-1.5 text-xs text-slate-500">
              Project:{' '}
              <Link
                href={`/projects/${project.id}`}
                className="font-bold text-blue-600 hover:underline"
              >
                {project.name}
              </Link>
              {project.project_number ? ` · ${project.project_number}` : ''}
            </p>
          </div>

          <div className="flex flex-col items-start gap-2 sm:items-end">
            <StatusBadge status={ticket.status} size="md" />
            <span className="text-[11px] text-slate-400">
              Updated {formatDate(ticket.updated_at, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
            </span>
          </div>
        </div>

        {/* Action button bar: PDF and Print */}
        <div className="no-print mt-6 border-t border-slate-100 pt-5">
          <TicketExport
            companyName={workspace.name}
            ticket={ticket}
            project={project}
            labor={labor || []}
            materials={materials || []}
            costs={costs || []}
            evidence={evidenceWithUrls}
          />
        </div>
      </header>

      {/* Disclaimers */}
      <div className="rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-xs leading-5 text-amber-950 shadow-xs">
        <strong>Field Tracking Record:</strong> Statuses and calculated values document time, materials, and field observations. This record does not establish formal customer approval, change order authorization, or guaranteed payment.
      </div>

      {project.is_archived && (
        <div className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-xs text-slate-700">
          This project is archived. Existing records are preserved for review, but new duplicates or tickets require restoring the project.
        </div>
      )}

      {/* Main Grid: Details + Sidebar */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* Main Column */}
        <div className="space-y-6">
          {/* Work Description */}
          <section className="card p-6">
            <div className="mb-3 flex items-center gap-2">
              <FileText size={17} className="text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">Work Description</h2>
            </div>
            <p className="whitespace-pre-wrap text-xs sm:text-sm leading-relaxed text-slate-700">
              {ticket.description}
            </p>

            {ticket.out_of_scope_reason && (
              <div className="mt-5 border-t border-slate-100 pt-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Reason Outside Original Scope
                </p>
                <p className="mt-1.5 whitespace-pre-wrap text-xs sm:text-sm leading-relaxed text-slate-700">
                  {ticket.out_of_scope_reason}
                </p>
              </div>
            )}
          </section>

          {/* Labor Breakdown */}
          <section className="card p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock3 size={17} className="text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900">Labor Entries</h2>
              </div>
              <span className="font-mono text-xs font-bold text-slate-900 tabular-nums">
                Subtotal: {formatCurrency(totals.labor)}
              </span>
            </div>

            {!labor?.length ? (
              <p className="text-xs text-slate-400">No labor entries recorded on this ticket.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="pb-2">Worker / Role</th>
                      <th className="pb-2 text-right">Hours</th>
                      <th className="pb-2 text-right">Rate</th>
                      <th className="pb-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {labor.map((item) => (
                      <tr key={item.id}>
                        <td className="py-2.5 font-medium text-slate-900">{item.worker_name}</td>
                        <td className="py-2.5 text-right font-mono text-slate-600 tabular-nums">{item.hours}</td>
                        <td className="py-2.5 text-right font-mono text-slate-600 tabular-nums">{formatCurrency(item.rate)}</td>
                        <td className="py-2.5 text-right font-mono font-bold text-slate-900 tabular-nums">{formatCurrency(item.line_total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Materials Breakdown */}
          <section className="card p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt size={17} className="text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900">Material Items</h2>
              </div>
              <span className="font-mono text-xs font-bold text-slate-900 tabular-nums">
                Subtotal: {formatCurrency(totals.materials)}
              </span>
            </div>

            {!materials?.length ? (
              <p className="text-xs text-slate-400">No material items recorded.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="pb-2">Description</th>
                      <th className="pb-2 text-right">Qty</th>
                      <th className="pb-2 text-right">Unit Cost</th>
                      <th className="pb-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {materials.map((item) => (
                      <tr key={item.id}>
                        <td className="py-2.5 font-medium text-slate-900">{item.description}</td>
                        <td className="py-2.5 text-right font-mono text-slate-600 tabular-nums">{item.quantity}</td>
                        <td className="py-2.5 text-right font-mono text-slate-600 tabular-nums">{formatCurrency(item.unit_cost)}</td>
                        <td className="py-2.5 text-right font-mono font-bold text-slate-900 tabular-nums">{formatCurrency(item.line_total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Equipment Breakdown */}
          <section className="card p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wrench size={17} className="text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900">Equipment & Other Costs</h2>
              </div>
              <span className="font-mono text-xs font-bold text-slate-900 tabular-nums">
                Subtotal: {formatCurrency(totals.other)}
              </span>
            </div>

            {!costs?.length ? (
              <p className="text-xs text-slate-400">No equipment or additional costs recorded.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="pb-2">Description</th>
                      <th className="pb-2 text-right">Qty</th>
                      <th className="pb-2 text-right">Unit Cost</th>
                      <th className="pb-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {costs.map((item) => (
                      <tr key={item.id}>
                        <td className="py-2.5 font-medium text-slate-900">{item.description}</td>
                        <td className="py-2.5 text-right font-mono text-slate-600 tabular-nums">{item.quantity}</td>
                        <td className="py-2.5 text-right font-mono text-slate-600 tabular-nums">{formatCurrency(item.unit_cost)}</td>
                        <td className="py-2.5 text-right font-mono font-bold text-slate-900 tabular-nums">{formatCurrency(item.line_total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Notes */}
          {ticket.notes && (
            <section className="card p-6">
              <h2 className="text-sm font-bold text-slate-900">Additional Observations</h2>
              <p className="mt-2 whitespace-pre-wrap text-xs sm:text-sm leading-relaxed text-slate-700">
                {ticket.notes}
              </p>
            </section>
          )}

          {/* Photo Evidence Gallery */}
          <EvidencePanel
            companyId={workspace.id}
            projectId={project.id}
            projectName={project.name}
            ticketId={ticket.id}
            ticketNumber={ticket.ticket_number}
            evidence={evidenceWithUrls}
          />
        </div>

        {/* Sidebar Column */}
        <aside className="space-y-6">
          {/* Financial Summary Card */}
          <div className="rounded-2xl border border-slate-900 bg-slate-900 p-6 text-white shadow-md">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Documented Record Total
            </p>
            <p className="mt-2 font-mono text-3xl font-black text-white tabular-nums">
              {formatCurrency(totals.total)}
            </p>

            <div className="mt-5 space-y-2 border-t border-slate-800 pt-4 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Labor</span>
                <span className="font-mono font-semibold">{formatCurrency(totals.labor)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Materials</span>
                <span className="font-mono font-semibold">{formatCurrency(totals.materials)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Other Costs</span>
                <span className="font-mono font-semibold">{formatCurrency(totals.other)}</span>
              </div>
            </div>

            <p className="mt-4 text-[10px] leading-relaxed text-slate-400">
              Calculated from documented field lines. Not an approved invoice or customer payment guarantee.
            </p>
          </div>

          {/* Work Context Card */}
          <div className="card p-5 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Jobsite Context
            </h2>

            <div className="space-y-3.5 text-xs">
              <div className="flex gap-2.5">
                <CalendarDays size={16} className="mt-0.5 shrink-0 text-blue-600" />
                <div>
                  <p className="text-slate-400 font-medium">Work Performed</p>
                  <p className="mt-0.5 font-semibold text-slate-900">
                    {formatDate(ticket.occurred_at, {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>

              <div className="flex gap-2.5">
                <MapPin size={16} className="mt-0.5 shrink-0 text-blue-600" />
                <div>
                  <p className="text-slate-400 font-medium">Location / Area</p>
                  <p className="mt-0.5 font-semibold text-slate-900">
                    {ticket.location || 'Not specified'}
                  </p>
                </div>
              </div>

              {ticket.gc_representative && (
                <div className="flex gap-2.5">
                  <UserRound size={16} className="mt-0.5 shrink-0 text-blue-600" />
                  <div>
                    <p className="text-slate-400 font-medium">GC / Customer Representative</p>
                    <p className="mt-0.5 font-semibold text-slate-900">
                      {ticket.gc_representative}
                    </p>
                  </div>
                </div>
              )}

              <div className="border-t border-slate-100 pt-3">
                <p className="text-slate-400 font-medium">Project</p>
                <Link
                  href={`/projects/${project.id}`}
                  className="mt-0.5 inline-block font-bold text-blue-600 hover:underline"
                >
                  {project.name}
                </Link>
                {project.site_address && (
                  <p className="mt-1 text-[11px] text-slate-500">{project.site_address}</p>
                )}
                {project.general_contractor && (
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    GC: {project.general_contractor}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Record History */}
          <div className="card p-5 text-xs text-slate-500 space-y-2">
            <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Audit Record
            </h2>
            <p>
              Created:{' '}
              <span className="font-semibold text-slate-700">
                {formatDate(ticket.created_at, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </span>
            </p>
            <p>
              Last Updated:{' '}
              <span className="font-semibold text-slate-700">
                {formatDate(ticket.updated_at, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </span>
            </p>
            <p className="pt-2 text-[11px] leading-relaxed border-t border-slate-100">
              All modifications are company-isolated in PostgreSQL via RLS security policies.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
