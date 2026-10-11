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
  Package,
  Plus,
  UserRound,
  Wrench,
} from 'lucide-react';
import { requireWorkspace } from '@/lib/data/workspace';
import { formatCurrency, formatDate, formatHours, formatQuantity } from '@/lib/utils';
import { calculateTicketTotals } from '@/lib/tickets/totals';
import { WorkspaceDataNotice } from '@/components/workspace/data-notice';
import { Alert } from '@/components/ui/alert';
import { ButtonLink } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { TableShell, Td, Th, Tr } from '@/components/ui/table';
import { StatusBadge } from '@/components/workspace/status-badge';
import { DeleteTicketButton } from '@/components/tickets/delete-ticket-button';
import { DuplicateTicketButton } from '@/components/tickets/duplicate-ticket-button';
import { TicketExport } from '@/components/tickets/ticket-export';
import { EvidencePanel, type EvidenceView } from '@/components/evidence/evidence-panel';

export const metadata: Metadata = { title: 'Work ticket' };

type Props = { params: Promise<{ id: string }> };

function LineItemsTable({
  rows,
  unitLabel,
}: {
  rows: Array<{ id: string; description: string; quantity: number; unitCost: number; total: number }>;
  unitLabel: string;
}) {
  return (
    <TableShell>
      <thead>
        <tr>
          <Th>{unitLabel === 'Hours' ? 'Worker / role' : 'Description'}</Th>
          <Th align="right" className="w-[6rem]">
            {unitLabel}
          </Th>
          <Th align="right" className="w-[7.5rem]">
            Rate
          </Th>
          <Th align="right" className="w-[8rem]">
            Amount
          </Th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <Tr key={row.id}>
            <Td className="font-medium text-ink">{row.description}</Td>
            <Td align="right" className="tabular-nums text-muted">
              {unitLabel === 'Hours' ? formatHours(row.quantity) : formatQuantity(row.quantity)}
            </Td>
            <Td align="right" className="font-mono tabular-nums text-muted">
              {formatCurrency(row.unitCost)}
              {unitLabel === 'Hours' ? <span className="text-faint"> /hr</span> : null}
            </Td>
            <Td align="right" className="font-mono font-semibold tabular-nums text-ink">
              {formatCurrency(row.total)}
            </Td>
          </Tr>
        ))}
        <tr className="bg-surface-2/70">
          <Td colSpan={3} className="py-2.5 text-right text-[12.5px] font-medium text-muted">
            Subtotal
          </Td>
          <Td align="right" className="py-2.5 font-mono text-[13.5px] font-semibold text-ink">
            {formatCurrency(rows.reduce((sum, row) => sum + row.total, 0))}
          </Td>
        </tr>
      </tbody>
    </TableShell>
  );
}

export default async function TicketDetailPage({ params }: Props) {
  const { id } = await params;
  const { supabase, user, workspace } = await requireWorkspace();

  const { data: ticket, error } = await supabase
    .from('work_tickets')
    .select('*')
    .eq('id', id)
    .eq('company_id', workspace.id)
    .maybeSingle();

  if (error) {
    return (
      <div className="space-y-6">
        <div className="print-page">
          <WorkspaceDataNotice />
        </div>
      </div>
    );
  }
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
    return (
      <div className="print-page">
        <WorkspaceDataNotice />
      </div>
    );
  }

  const evidenceRows = evidence ?? [];
  const signedEvidence = evidenceRows.length
    ? await supabase.storage
        .from('evidence')
        .createSignedUrls(
          evidenceRows.map((row) => row.storage_path),
          3600
        )
    : { data: [], error: null };
  // createSignedUrls preserves request order; map by index so previews work
  // regardless of whether the response echoes each path.
  const evidenceWithUrls: EvidenceView[] = evidenceRows.map((row, index) => ({
    ...row,
    signedUrl: signedEvidence.data?.[index]?.signedUrl ?? null,
    canDelete: row.uploaded_by === user.id,
  }));

  const labourRows = labor ?? [];
  const materialRows = materials ?? [];
  const costRows = costs ?? [];

  const totals = calculateTicketTotals({
    labor: labourRows.map((row) => ({ hours: Number(row.hours), rate: Number(row.rate) })),
    materials: materialRows.map((row) => ({
      quantity: Number(row.quantity),
      unit_cost: Number(row.unit_cost),
    })),
    costs: costRows.map((row) => ({ quantity: Number(row.quantity), unit_cost: Number(row.unit_cost) })),
  });

  const canEdit = ticket.created_by === user.id;
  const isDraft = ticket.status === 'draft';

  return (
    <div className="print-page space-y-6">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/tickets"
          className="inline-flex min-h-9 items-center gap-1.5 rounded-lg text-[13px] font-medium text-muted transition-colors duration-150 hover:text-ink"
        >
          <ArrowLeft size={15} aria-hidden="true" />
          All work tickets
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          {canEdit && (
            <ButtonLink href={`/tickets/${ticket.id}/edit`} variant="secondary">
              <Pencil size={14} aria-hidden="true" />
              Edit
            </ButtonLink>
          )}
          {project.is_archived ? (
            <span className="text-[12px] text-muted">Restore the project to duplicate</span>
          ) : (
            <DuplicateTicketButton ticketId={ticket.id} ticketNumber={ticket.ticket_number} />
          )}
          {canEdit && isDraft && (
            <DeleteTicketButton id={ticket.id} ticketNumber={ticket.ticket_number} />
          )}
        </div>
      </div>

      {/* Document header */}
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-6 p-5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="font-mono text-[1.375rem] font-semibold tracking-[-0.01em] text-ink">
                  {ticket.ticket_number}
                </span>
                <StatusBadge status={ticket.status} />
              </div>
              <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-muted">
                <span className="font-medium text-body">{project.name}</span>
                {project.project_number && (
                  <>
                    <span aria-hidden="true" className="text-faint">
                      ·
                    </span>
                    <span className="font-mono">{project.project_number}</span>
                  </>
                )}
                <span aria-hidden="true" className="text-faint">
                  ·
                </span>
                <Link href={`/projects/${project.id}`} className="link">
                  Open project
                </Link>
              </p>
            </div>

            <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-[13px] sm:grid-cols-3">
              <div>
                <dt className="text-subtle">Work performed</dt>
                <dd className="mt-0.5 font-medium text-ink">
                  {formatDate(ticket.occurred_at, { month: 'short', day: 'numeric', year: 'numeric' })}
                </dd>
              </div>
              <div>
                <dt className="text-subtle">Documented total</dt>
                <dd className="mt-0.5 font-mono font-semibold text-ink">
                  {formatCurrency(totals.total)}
                </dd>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <dt className="text-subtle">Last updated</dt>
                <dd className="mt-0.5 font-medium text-ink">
                  {formatDate(ticket.updated_at, { month: 'short', day: 'numeric', year: 'numeric' })}
                </dd>
              </div>
            </dl>
          </div>

          <div className="no-print border-t border-line pt-5">
            <TicketExport
              companyName={workspace.name}
              ticket={ticket}
              project={project}
              labor={labourRows}
              materials={materialRows}
              costs={costRows}
              evidence={evidenceWithUrls}
            />
          </div>
        </div>
      </Card>

      {project.is_archived && (
        <Alert tone="warning" title="This project is archived">
          The record is preserved and can still be exported. Restore the project to duplicate it or
          create new tickets.
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start">
        {/* Document body */}
        <div className="space-y-6">
          <Card flush>
            <CardHeader
              title="Work performed"
              description="What the crew did and why it fell outside the original scope."
              bordered
            />
            <div className="px-5 py-5 sm:px-6">
              <p className="whitespace-pre-wrap text-[14px] leading-7 text-body">
                {ticket.description}
              </p>
            </div>
            {ticket.out_of_scope_reason && (
              <div className="border-t border-line bg-surface-2/50 px-5 py-5 sm:px-6">
                <h3 className="text-[12px] font-semibold uppercase tracking-[0.06em] text-subtle">
                  Reason outside original scope
                </h3>
                <p className="mt-2 whitespace-pre-wrap text-[13.5px] leading-6 text-body">
                  {ticket.out_of_scope_reason}
                </p>
              </div>
            )}
            {ticket.notes && (
              <div className="border-t border-line px-5 py-5 sm:px-6">
                <h3 className="text-[12px] font-semibold uppercase tracking-[0.06em] text-subtle">
                  Additional observations
                </h3>
                <p className="mt-2 whitespace-pre-wrap text-[13.5px] leading-6 text-body">
                  {ticket.notes}
                </p>
              </div>
            )}
          </Card>

          <Card flush>
            <CardHeader
              title="Labor"
              description={
                labourRows.length
                  ? `${formatHours(labourRows.reduce((sum, row) => sum + Number(row.hours), 0))} hours across ${labourRows.length} ${labourRows.length === 1 ? 'line' : 'lines'}`
                  : 'No labor recorded on this ticket'
              }
              icon={<Clock3 size={16} aria-hidden="true" />}
              bordered
              action={
                <span className="font-mono text-[13px] font-semibold text-ink">
                  {formatCurrency(totals.labor)}
                </span>
              }
            />
            {labourRows.length === 0 ? (
              <p className="px-5 py-6 text-[13px] text-muted sm:px-6">
                No labor lines were recorded for this ticket.
              </p>
            ) : (
              <LineItemsTable
                unitLabel="Hours"
                rows={labourRows.map((row) => ({
                  id: row.id,
                  description: row.worker_name,
                  quantity: Number(row.hours),
                  unitCost: Number(row.rate),
                  total: Number(row.line_total),
                }))}
              />
            )}
          </Card>

          <Card flush>
            <CardHeader
              title="Materials"
              description={
                materialRows.length
                  ? `${materialRows.length} ${materialRows.length === 1 ? 'line' : 'lines'} of materials and supplies`
                  : 'No materials recorded on this ticket'
              }
              icon={<Package size={16} aria-hidden="true" />}
              bordered
              action={
                <span className="font-mono text-[13px] font-semibold text-ink">
                  {formatCurrency(totals.materials)}
                </span>
              }
            />
            {materialRows.length === 0 ? (
              <p className="px-5 py-6 text-[13px] text-muted sm:px-6">
                No material lines were recorded for this ticket.
              </p>
            ) : (
              <LineItemsTable
                unitLabel="Qty"
                rows={materialRows.map((row) => ({
                  id: row.id,
                  description: row.description,
                  quantity: Number(row.quantity),
                  unitCost: Number(row.unit_cost),
                  total: Number(row.line_total),
                }))}
              />
            )}
          </Card>

          <Card flush>
            <CardHeader
              title="Equipment & other costs"
              description={
                costRows.length
                  ? `${costRows.length} ${costRows.length === 1 ? 'line' : 'lines'} of rentals and direct costs`
                  : 'No equipment or direct costs on this ticket'
              }
              icon={<Wrench size={16} aria-hidden="true" />}
              bordered
              action={
                <span className="font-mono text-[13px] font-semibold text-ink">
                  {formatCurrency(totals.other)}
                </span>
              }
            />
            {costRows.length === 0 ? (
              <p className="px-5 py-6 text-[13px] text-muted sm:px-6">
                No equipment or other cost lines were recorded.
              </p>
            ) : (
              <LineItemsTable
                unitLabel="Qty"
                rows={costRows.map((row) => ({
                  id: row.id,
                  description: row.description,
                  quantity: Number(row.quantity),
                  unitCost: Number(row.unit_cost),
                  total: Number(row.line_total),
                }))}
              />
            )}
          </Card>

          <EvidencePanel
            companyId={workspace.id}
            projectId={project.id}
            projectName={project.name}
            ticketId={ticket.id}
            ticketNumber={ticket.ticket_number}
            evidence={evidenceWithUrls}
          />
        </div>

        {/* Side rail */}
        <aside className="space-y-6 lg:sticky lg:top-20">
          <Card flush>
            <div className="p-5">
              <h2 className="text-[12px] font-semibold uppercase tracking-[0.06em] text-subtle">
                Documented total
              </h2>
              <p className="mt-2 font-mono text-[1.75rem] font-semibold leading-none tracking-[-0.02em] text-ink">
                {formatCurrency(totals.total)}
              </p>
              <dl className="mt-4 space-y-2 border-t border-line pt-4 text-[13px]">
                {[
                  ['Labor', totals.labor, labourRows.length],
                  ['Materials', totals.materials, materialRows.length],
                  ['Equipment & other', totals.other, costRows.length],
                ].map(([label, value, count]) => (
                  <div key={label as string} className="flex items-baseline justify-between gap-3">
                    <dt className="text-muted">
                      {label as string}
                      <span className="ml-1.5 text-[11px] text-faint">({count as number})</span>
                    </dt>
                    <dd className="font-mono font-medium text-body tabular-nums">
                      {formatCurrency(value as number)}
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="mt-4 border-t border-line pt-3 text-[11.5px] leading-5 text-subtle">
                Calculated from the field entries on this ticket. Not an approved invoice, and not a
                guarantee of payment.
              </p>
            </div>
          </Card>

          <Card flush>
            <CardHeader title="Jobsite context" bordered />
            {/* Each <div> is a legal <dl> group and holds exactly one <dt>/<dd> pair. */}
            <dl className="divide-y divide-line">
              <div className="px-5 py-3.5">
                <dt className="flex items-center gap-2.5 text-[12px] text-subtle">
                  <CalendarDays size={15} className="shrink-0" aria-hidden="true" />
                  Work performed
                </dt>
                <dd className="mt-1 pl-[26px] text-[13px] font-medium text-ink">
                  {formatDate(ticket.occurred_at, {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </dd>
              </div>
              <div className="px-5 py-3.5">
                <dt className="flex items-center gap-2.5 text-[12px] text-subtle">
                  <MapPin size={15} className="shrink-0" aria-hidden="true" />
                  Area / location
                </dt>
                <dd className="mt-1 pl-[26px] text-[13px] font-medium text-ink">
                  {ticket.location || 'Not recorded'}
                </dd>
              </div>
              <div className="px-5 py-3.5">
                <dt className="flex items-center gap-2.5 text-[12px] text-subtle">
                  <UserRound size={15} className="shrink-0" aria-hidden="true" />
                  Directed / verified by
                </dt>
                <dd className="mt-1 pl-[26px] text-[13px] font-medium text-ink">
                  {ticket.gc_representative || 'Not recorded'}
                </dd>
              </div>
              <div className="px-5 py-3.5">
                <dt className="flex items-center gap-2.5 text-[12px] text-subtle">
                  <FileText size={15} className="shrink-0" aria-hidden="true" />
                  Project
                </dt>
                <dd className="mt-1 pl-[26px] text-[13px] font-medium text-ink">
                  <Link href={`/projects/${project.id}`} className="link">
                    {project.name}
                  </Link>
                </dd>
                {project.general_contractor && (
                  <dd className="mt-1 pl-[26px] text-[12px] text-muted">GC: {project.general_contractor}</dd>
                )}
                {project.site_address && (
                  <dd className="mt-0.5 pl-[26px] text-[12px] text-muted">{project.site_address}</dd>
                )}
              </div>
            </dl>
          </Card>

          <Card flush>
            <CardHeader title="Record history" bordered />
            <dl className="px-5 py-4 text-[12.5px]">
              <div className="flex justify-between gap-3 py-1">
                <dt className="text-muted">Created</dt>
                <dd className="font-medium text-body">
                  {formatDate(ticket.created_at, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </dd>
              </div>
              <div className="flex justify-between gap-3 py-1">
                <dt className="text-muted">Last updated</dt>
                <dd className="font-medium text-body">
                  {formatDate(ticket.updated_at, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </dd>
              </div>
              <div className="flex justify-between gap-3 py-1">
                <dt className="text-muted">Editing access</dt>
                <dd className="font-medium text-body">{canEdit ? 'You can edit' : 'Creator only'}</dd>
              </div>
            </dl>
            {/* A <dl> may only group <dt>/<dd> pairs, so the footnote sits outside it. */}
            <p className="border-t border-line px-5 pb-4 pt-3 text-[11.5px] leading-5 text-subtle">
              Records are isolated per company in Postgres through row-level security.
            </p>
          </Card>

          {canEdit && !project.is_archived && (
            <ButtonLink
              href={`/tickets/new?projectId=${project.id}`}
              variant="secondary"
              className="w-full"
            >
              <Plus size={15} aria-hidden="true" />
              Add another ticket for this job
            </ButtonLink>
          )}
        </aside>
      </div>
    </div>
  );
}
