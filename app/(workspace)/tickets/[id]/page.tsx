import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CalendarDays, Clock3, FileText, MapPin, Pencil, Plus, UserRound } from 'lucide-react';
import { requireWorkspace } from '@/lib/data/workspace';
import { formatCurrency, formatDate } from '@/lib/utils';
import { calculateTicketTotals } from '@/lib/tickets/totals';
import { compareFieldTicketTotals } from '@/lib/fieldticket/compare';
import { PageHeader, DataSetupMessage } from '@/components/workspace/app-page';
import { StatusBadge } from '@/components/workspace/status-badge';
import { ButtonLink } from '@/components/ui/button';
import { duplicateTicketAction } from '@/lib/actions/tickets';
import { DeleteTicketButton } from '@/components/tickets/delete-ticket-button';
import { TicketExport } from '@/components/tickets/ticket-export';
import { EvidencePanel, type EvidenceView } from '@/components/evidence/evidence-panel';

export const metadata: Metadata = { title: 'Work ticket' };
type Props = { params: Promise<{ id: string }> };

export default async function TicketDetailPage({ params }: Props) {
  const { id } = await params;
  const { supabase, user, workspace } = await requireWorkspace();
  const { data: ticket, error } = await supabase.from('work_tickets').select('*').eq('id', id).eq('company_id', workspace.id).maybeSingle();
  if (error) return <DataSetupMessage />;
  if (!ticket) notFound();
  const [{ data: project, error: projectError }, { data: labor, error: laborError }, { data: materials, error: materialError }, { data: costs, error: costError }, { data: evidence, error: evidenceError }] = await Promise.all([
    supabase.from('projects').select('id, name, project_number, site_address, general_contractor, is_archived').eq('id', ticket.project_id).eq('company_id', workspace.id).maybeSingle(),
    supabase.from('labor_entries').select('*').eq('ticket_id', ticket.id).eq('company_id', workspace.id).order('created_at'),
    supabase.from('material_entries').select('*').eq('ticket_id', ticket.id).eq('company_id', workspace.id).order('created_at'),
    supabase.from('ticket_costs').select('*').eq('ticket_id', ticket.id).eq('company_id', workspace.id).order('created_at'),
    supabase.from('evidence_files').select('*').eq('ticket_id', ticket.id).eq('company_id', workspace.id).order('created_at', { ascending: false }),
  ]);
  if (projectError || laborError || materialError || costError || evidenceError || !project) return <><PageHeader title={ticket.ticket_number} /><DataSetupMessage /></>;
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
  const totals = calculateTicketTotals({ labor: labor || [], materials: materials || [], costs: costs || [] });
  const fieldticketComparison =
    process.env.FIELDTICKET_COMPARISON_ENABLED === 'true'
      ? await compareFieldTicketTotals({
          ticket_number: ticket.ticket_number,
          contractor: workspace.name,
          customer: project.general_contractor || 'Not specified',
          project: project.name,
          work_date: ticket.occurred_at.slice(0, 10),
          description: ticket.description,
          labor: labor || [],
          materials: materials || [],
          costs: costs || [],
        })
      : null;

  const canEdit = ticket.created_by === user.id;

  return <div className="print-page">
    <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-3"><Link href="/tickets" className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-muted hover:text-ink"><ArrowLeft size={16} />Work tickets</Link><div className="flex flex-wrap gap-2">{canEdit && <ButtonLink href={`/tickets/${ticket.id}/edit`} variant="secondary"><Pencil size={15} />Edit ticket</ButtonLink>}{!project.is_archived ? <form action={duplicateTicketAction}><input type="hidden" name="id" value={ticket.id} /><button type="submit" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-bold text-ink hover:bg-slate-50"><Plus size={15} />Duplicate</button></form> : <span className="px-2 text-xs text-muted">Restore project to duplicate</span>}{canEdit && ticket.status === 'draft' && <DeleteTicketButton id={ticket.id} ticketNumber={ticket.ticket_number} />}</div></div>

    <header className="mb-6 flex flex-col gap-4 border-b border-line pb-5 sm:flex-row sm:items-start sm:justify-between">
      <div><p className="eyebrow">Time & material work record</p><h1 className="mt-2 font-mono text-2xl font-extrabold tracking-[-0.04em] text-ink sm:text-3xl">{ticket.ticket_number}</h1><p className="mt-2 text-sm text-muted">Project <Link href={`/projects/${project.id}`} className="font-bold text-orange-dark hover:underline">{project.name}</Link>{project.project_number ? ` · ${project.project_number}` : ''}</p></div>
      <div className="flex flex-col items-start gap-2 sm:items-end"><StatusBadge status={ticket.status} /><p className="text-xs text-muted">Last updated {formatDate(ticket.updated_at)}</p></div>
    </header>

    <div className="no-print mb-6"><TicketExport ticket={ticket} project={project} labor={labor || []} materials={materials || []} costs={costs || []} evidence={evidenceWithUrls} /></div>
    {project.is_archived && <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-700">This project is archived. Existing records can still be updated, but new tickets or duplicates require restoring the project first.</div>}
    <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-950"><strong>Tracking record only.</strong> The status and calculated amounts do not establish customer approval, contract entitlement, or payment. Follow your contract and customer process.</div>

    {fieldticketComparison && (
      <div className="no-print mb-4 rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink">
        <strong>FieldTicket comparison:</strong>{' '}
        {fieldticketComparison.status === 'matched'
          ? 'Totals match'
          : fieldticketComparison.status === 'mismatch'
            ? 'Totals differ — review required'
            : fieldticketComparison.status === 'skipped'
              ? 'Comparison skipped'
              : 'Comparison unavailable'}
      </div>
    )}

    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-5">
        <section className="rounded-2xl border border-line bg-white p-5 sm:p-6"><div className="mb-4 flex items-center gap-2"><FileText size={17} className="text-orange" /><h2 className="font-bold text-ink">Work description</h2></div><p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">{ticket.description}</p>{ticket.out_of_scope_reason && <div className="mt-5 border-t border-line pt-4"><p className="text-xs font-bold uppercase tracking-[0.1em] text-muted">Reason outside original scope</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{ticket.out_of_scope_reason}</p></div>}</section>

        <section className="rounded-2xl border border-line bg-white p-5 sm:p-6"><div className="mb-4 flex items-center gap-2"><Clock3 size={17} className="text-orange" /><h2 className="font-bold text-ink">Labor</h2></div>{!labor?.length ? <p className="text-sm text-muted">No labor entries on this record.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[420px] text-left text-sm"><thead className="border-b border-line text-[10px] font-bold uppercase tracking-[0.1em] text-muted"><tr><th className="pb-2">Worker / role</th><th className="pb-2 text-right">Hours</th><th className="pb-2 text-right">Rate</th><th className="pb-2 text-right">Total</th></tr></thead><tbody className="divide-y divide-line">{labor.map((item) => <tr key={item.id}><td className="py-3 font-medium text-ink">{item.worker_name}</td><td className="py-3 text-right text-slate-600">{item.hours}</td><td className="py-3 text-right text-slate-600">{formatCurrency(item.rate)}</td><td className="py-3 text-right font-semibold text-ink">{formatCurrency(item.line_total)}</td></tr>)}</tbody><tfoot><tr><td colSpan={3} className="pt-3 text-right text-xs font-bold text-muted">Labor total</td><td className="pt-3 text-right font-bold text-ink">{formatCurrency(totals.labor)}</td></tr></tfoot></table></div>}</section>

        <section className="rounded-2xl border border-line bg-white p-5 sm:p-6"><div className="mb-4 flex items-center gap-2"><FileText size={17} className="text-orange" /><h2 className="font-bold text-ink">Materials</h2></div>{!materials?.length ? <p className="text-sm text-muted">No material entries on this record.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[420px] text-left text-sm"><thead className="border-b border-line text-[10px] font-bold uppercase tracking-[0.1em] text-muted"><tr><th className="pb-2">Description</th><th className="pb-2 text-right">Qty</th><th className="pb-2 text-right">Unit cost</th><th className="pb-2 text-right">Total</th></tr></thead><tbody className="divide-y divide-line">{materials.map((item) => <tr key={item.id}><td className="py-3 font-medium text-ink">{item.description}</td><td className="py-3 text-right text-slate-600">{item.quantity}</td><td className="py-3 text-right text-slate-600">{formatCurrency(item.unit_cost)}</td><td className="py-3 text-right font-semibold text-ink">{formatCurrency(item.line_total)}</td></tr>)}</tbody><tfoot><tr><td colSpan={3} className="pt-3 text-right text-xs font-bold text-muted">Materials total</td><td className="pt-3 text-right font-bold text-ink">{formatCurrency(totals.materials)}</td></tr></tfoot></table></div>}</section>

        <section className="rounded-2xl border border-line bg-white p-5 sm:p-6"><div className="mb-4 flex items-center gap-2"><FileText size={17} className="text-orange" /><h2 className="font-bold text-ink">Equipment and other costs</h2></div>{!costs?.length ? <p className="text-sm text-muted">No equipment or other cost entries.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[420px] text-left text-sm"><thead className="border-b border-line text-[10px] font-bold uppercase tracking-[0.1em] text-muted"><tr><th className="pb-2">Description</th><th className="pb-2 text-right">Qty</th><th className="pb-2 text-right">Unit cost</th><th className="pb-2 text-right">Total</th></tr></thead><tbody className="divide-y divide-line">{costs.map((item) => <tr key={item.id}><td className="py-3 font-medium text-ink">{item.description}</td><td className="py-3 text-right text-slate-600">{item.quantity}</td><td className="py-3 text-right text-slate-600">{formatCurrency(item.unit_cost)}</td><td className="py-3 text-right font-semibold text-ink">{formatCurrency(item.line_total)}</td></tr>)}</tbody><tfoot><tr><td colSpan={3} className="pt-3 text-right text-xs font-bold text-muted">Other total</td><td className="pt-3 text-right font-bold text-ink">{formatCurrency(totals.other)}</td></tr></tfoot></table></div>}</section>

        {ticket.notes && <section className="rounded-2xl border border-line bg-white p-5 sm:p-6"><h2 className="font-bold text-ink">Additional notes</h2><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{ticket.notes}</p></section>}
        <EvidencePanel companyId={workspace.id} projectId={project.id} projectName={project.name} ticketId={ticket.id} ticketNumber={ticket.ticket_number} evidence={evidenceWithUrls} />
      </div>

      <aside className="space-y-4">
        <section className="rounded-2xl bg-navy p-5 text-white sm:p-6"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">Documented total</p><p className="mt-2 text-3xl font-extrabold tracking-[-0.04em]">{formatCurrency(totals.total)}</p><div className="mt-5 space-y-2 border-t border-white/15 pt-4 text-xs"><div className="flex justify-between gap-3 text-white/70"><span>Labor</span><span>{formatCurrency(totals.labor)}</span></div><div className="flex justify-between gap-3 text-white/70"><span>Materials</span><span>{formatCurrency(totals.materials)}</span></div><div className="flex justify-between gap-3 text-white/70"><span>Other costs</span><span>{formatCurrency(totals.other)}</span></div></div><p className="mt-4 text-[10px] leading-4 text-white/45">Calculated from recorded entries. Not an invoice or proof of approval.</p></section>
        <section className="rounded-2xl border border-line bg-white p-5"><h2 className="font-bold text-ink">Work context</h2><div className="mt-4 space-y-4 text-sm"><div className="flex gap-3"><CalendarDays size={16} className="mt-0.5 shrink-0 text-orange" /><div><p className="text-xs text-muted">Date and time</p><p className="mt-1 font-medium text-ink">{formatDate(ticket.occurred_at, { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</p></div></div><div className="flex gap-3"><MapPin size={16} className="mt-0.5 shrink-0 text-orange" /><div><p className="text-xs text-muted">Area of work</p><p className="mt-1 font-medium text-ink">{ticket.location || 'Not specified'}</p></div></div>{ticket.gc_representative && <div className="flex gap-3"><UserRound size={16} className="mt-0.5 shrink-0 text-orange" /><div><p className="text-xs text-muted">Representative</p><p className="mt-1 font-medium text-ink">{ticket.gc_representative}</p></div></div>}<div className="border-t border-line pt-3"><p className="text-xs text-muted">Project</p><Link href={`/projects/${project.id}`} className="mt-1 inline-flex items-center gap-1 font-semibold text-orange-dark hover:underline">{project.name}<span aria-hidden="true">↗</span></Link>{project.site_address && <p className="mt-1 text-xs leading-5 text-muted">{project.site_address}</p>}</div></div></section>
        <section className="rounded-2xl border border-line bg-white p-5"><h2 className="font-bold text-ink">Record history</h2><p className="mt-3 text-xs text-muted">Created {formatDate(ticket.created_at, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</p><p className="mt-1 text-xs text-muted">Updated {formatDate(ticket.updated_at, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</p><p className="mt-3 text-xs leading-5 text-muted">Status is tracked by your team and is not independently verified.</p></section>
      </aside>
    </div>
  </div>;
}
