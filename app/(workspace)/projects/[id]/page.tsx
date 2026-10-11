import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Building2,
  Camera,
  CalendarDays,
  FileText,
  MapPin,
  Pencil,
  Plus,
  ReceiptText,
  Tag,
  TrendingUp,
  Wrench,
} from 'lucide-react';
import { requireWorkspace } from '@/lib/data/workspace';
import { formatCurrency, formatDate } from '@/lib/utils';
import { calculateTicketTotals } from '@/lib/tickets/totals';
import { WorkspaceDataNotice } from '@/components/workspace/data-notice';
import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import { Card, CardFooter, CardHeader } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat';
import { TableShell, Td, Th, Tr } from '@/components/ui/table';
import { StatusBadge } from '@/components/workspace/status-badge';
import { ProjectArchiveButton } from '@/components/forms/project-archive-button';

export const metadata: Metadata = { title: 'Project' };

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

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Project" />
        <WorkspaceDataNotice />
      </div>
    );
  }
  if (!project) notFound();

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
      .select('id, original_filename, caption, storage_path, created_at')
      .eq('project_id', project.id)
      .eq('company_id', workspace.id)
      .order('created_at', { ascending: false })
      .limit(12),
  ]);

  if (ticketsRes.error) {
    return (
      <div className="space-y-6">
        <PageHeader title={project.name} />
        <WorkspaceDataNotice />
      </div>
    );
  }

  const tickets = ticketsRes.data ?? [];
  const ticketIds = tickets.map((ticket) => ticket.id);

  const [laborRes, materialsRes, costsRes] = await Promise.all([
    ticketIds.length
      ? supabase
          .from('labor_entries')
          .select('ticket_id, hours, rate')
          .eq('company_id', workspace.id)
          .in('ticket_id', ticketIds)
      : Promise.resolve({ data: [], error: null }),
    ticketIds.length
      ? supabase
          .from('material_entries')
          .select('ticket_id, quantity, unit_cost')
          .eq('company_id', workspace.id)
          .in('ticket_id', ticketIds)
      : Promise.resolve({ data: [], error: null }),
    ticketIds.length
      ? supabase
          .from('ticket_costs')
          .select('ticket_id, quantity, unit_cost')
          .eq('company_id', workspace.id)
          .in('ticket_id', ticketIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

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

  const projectTotals = calculateTicketTotals({
    labor: labourRows.map((row) => ({ hours: Number(row.hours), rate: Number(row.rate) })),
    materials: materialRows.map((row) => ({
      quantity: Number(row.quantity),
      unit_cost: Number(row.unit_cost),
    })),
    costs: costRows.map((row) => ({ quantity: Number(row.quantity), unit_cost: Number(row.unit_cost) })),
  });

  const openTickets = tickets.filter((ticket) =>
    ['draft', 'ready_for_review', 'submitted'].includes(ticket.status)
  ).length;

  const evidenceFiles = evidenceRes.data ?? [];
  const signedEvidence = evidenceFiles.length
    ? await supabase.storage
        .from('evidence')
        .createSignedUrls(
          evidenceFiles.map((file) => file.storage_path),
          3600
        )
    : { data: [], error: null };
  const signedUrlByPath = new Map(
    (signedEvidence.data ?? []).map((item) => [item.path ?? '', item.signedUrl])
  );

  return (
    <div className="space-y-6">
      <Link
        href="/projects"
        className="inline-flex min-h-9 items-center gap-1.5 rounded-lg text-[13px] font-medium text-muted transition-colors duration-150 hover:text-ink"
      >
        <ArrowLeft size={15} aria-hidden="true" />
        All projects
      </Link>

      <PageHeader
        eyebrow="Project"
        title={project.name}
        description={project.notes ? undefined : 'Extra work recorded against this jobsite.'}
        meta={
          <>
            {project.project_number && (
              <Badge tone="neutral" size="sm">
                <Tag size={11} aria-hidden="true" />
                <span className="font-mono">{project.project_number}</span>
              </Badge>
            )}
            {project.is_archived ? (
              <Badge tone="neutral" size="sm" dot>
                Archived
              </Badge>
            ) : (
              <Badge tone="success" size="sm" dot>
                Active
              </Badge>
            )}
            <span className="text-[13px] text-muted">
              Created {formatDate(project.created_at)}
            </span>
          </>
        }
        action={
          <>
            <ButtonLink href={`/projects/${project.id}/edit`} variant="secondary">
              <Pencil size={14} aria-hidden="true" />
              Edit
            </ButtonLink>
            {!project.is_archived && (
              <ButtonLink href={`/tickets/new?projectId=${project.id}`}>
                <Plus size={16} strokeWidth={2.5} aria-hidden="true" />
                New ticket
              </ButtonLink>
            )}
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Documented work"
          value={formatCurrency(projectTotals.total)}
          context={`Across ${tickets.length} ${tickets.length === 1 ? 'ticket' : 'tickets'}`}
          tone="brand"
          icon={<TrendingUp size={17} aria-hidden="true" />}
        />
        <StatCard
          label="Labor"
          value={formatCurrency(projectTotals.labor)}
          context={`${labourRows.length} labor ${labourRows.length === 1 ? 'line' : 'lines'}`}
          icon={<ReceiptText size={17} aria-hidden="true" />}
        />
        <StatCard
          label="Materials"
          value={formatCurrency(projectTotals.materials)}
          context={`${materialRows.length} material ${materialRows.length === 1 ? 'line' : 'lines'}`}
          icon={<FileText size={17} aria-hidden="true" />}
        />
        <StatCard
          label="Equipment & other"
          value={formatCurrency(projectTotals.other)}
          context={`${costRows.length} cost ${costRows.length === 1 ? 'line' : 'lines'}`}
          icon={<Wrench size={17} aria-hidden="true" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:items-start">
        {/* Tickets */}
        <Card flush>
          <CardHeader
            title="Work tickets"
            description={
              tickets.length
                ? `${openTickets} open · ${tickets.length} total`
                : 'No tickets recorded for this project yet'
            }
            bordered
            action={
              !project.is_archived && (
                <ButtonLink href={`/tickets/new?projectId=${project.id}`} variant="secondary" size="sm">
                  <Plus size={14} aria-hidden="true" />
                  New
                </ButtonLink>
              )
            }
          />

          {tickets.length === 0 ? (
            <div className="p-5 sm:p-6">
              <EmptyState
                icon={<ReceiptText size={20} aria-hidden="true" />}
                title="No tickets yet"
                description="When a change or field condition creates extra work, record it here with hours, materials and photos."
                action={
                  !project.is_archived ? (
                    <ButtonLink href={`/tickets/new?projectId=${project.id}`}>
                      <Plus size={15} aria-hidden="true" />
                      Create first ticket
                    </ButtonLink>
                  ) : undefined
                }
              />
            </div>
          ) : (
            <TableShell caption={`Work tickets for ${project.name}`}>
              <thead>
                <tr>
                  <Th className="w-[10rem]">Ticket</Th>
                  <Th>Extra work</Th>
                  <Th className="hidden w-[9rem] md:table-cell">Status</Th>
                  <Th align="right" className="w-[7.5rem]">
                    Documented
                  </Th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
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
                      <Link href={`/tickets/${ticket.id}`} className="block rounded">
                        <span className="line-clamp-2 text-[13.5px] leading-5 text-body">
                          {ticket.description}
                        </span>
                        <span className="mt-1 block md:hidden">
                          <StatusBadge status={ticket.status} size="xs" />
                        </span>
                      </Link>
                    </Td>
                    <Td className="hidden md:table-cell">
                      <StatusBadge status={ticket.status} size="xs" />
                    </Td>
                    <Td align="right">
                      <span className="font-mono text-[13px] font-semibold text-ink">
                        {formatCurrency(ticketTotalById.get(ticket.id) ?? 0)}
                      </span>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </TableShell>
          )}
        </Card>

        {/* Project profile */}
        <div className="space-y-6">
          <Card flush>
            <CardHeader title="Job details" bordered />
            <dl className="divide-y divide-line">
              <div className="flex gap-3 px-5 py-3.5">
                <Building2 size={16} className="mt-0.5 shrink-0 text-faint" aria-hidden="true" />
                <div className="min-w-0">
                  <dt className="text-[12px] text-subtle">General contractor</dt>
                  <dd className="mt-0.5 text-[13.5px] font-medium text-ink">
                    {project.general_contractor || 'Not recorded'}
                  </dd>
                </div>
              </div>
              <div className="flex gap-3 px-5 py-3.5">
                <MapPin size={16} className="mt-0.5 shrink-0 text-faint" aria-hidden="true" />
                <div className="min-w-0">
                  <dt className="text-[12px] text-subtle">Jobsite address</dt>
                  <dd className="mt-0.5 text-[13.5px] font-medium text-ink">
                    {project.site_address || 'Not recorded'}
                  </dd>
                </div>
              </div>
              <div className="flex gap-3 px-5 py-3.5">
                <Tag size={16} className="mt-0.5 shrink-0 text-faint" aria-hidden="true" />
                <div className="min-w-0">
                  <dt className="text-[12px] text-subtle">Job number</dt>
                  <dd className="mt-0.5 font-mono text-[13.5px] font-medium text-ink">
                    {project.project_number || 'Not recorded'}
                  </dd>
                </div>
              </div>
              <div className="flex gap-3 px-5 py-3.5">
                <CalendarDays size={16} className="mt-0.5 shrink-0 text-faint" aria-hidden="true" />
                <div className="min-w-0">
                  <dt className="text-[12px] text-subtle">Last updated</dt>
                  <dd className="mt-0.5 text-[13.5px] font-medium text-ink">
                    {formatDate(project.updated_at, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </dd>
                </div>
              </div>
            </dl>
            {project.notes && (
              <div className="border-t border-line bg-surface-2/50 px-5 py-4">
                <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-subtle">
                  Scope notes
                </p>
                <p className="mt-1.5 whitespace-pre-wrap text-[13px] leading-6 text-body">
                  {project.notes}
                </p>
              </div>
            )}
            <CardFooter>
              <p className="text-[12px] text-muted">
                {project.is_archived
                  ? 'Archived — restore to create new tickets.'
                  : 'Archiving preserves every ticket and photo.'}
              </p>
              <ProjectArchiveButton
                id={project.id}
                isArchived={project.is_archived}
                projectName={project.name}
              />
            </CardFooter>
          </Card>

          <Card flush>
            <CardHeader
              title="Evidence"
              description={
                evidenceFiles.length
                  ? `${evidenceFiles.length} recent ${evidenceFiles.length === 1 ? 'photo' : 'photos'}`
                  : 'No photos for this project yet'
              }
              bordered
              action={
                <ButtonLink href="/evidence" variant="secondary" size="sm">
                  <Camera size={14} aria-hidden="true" />
                  Upload
                </ButtonLink>
              }
            />
            {evidenceFiles.length === 0 ? (
              <p className="px-5 py-6 text-[13px] text-muted">
                Jobsite photos uploaded against this project or its tickets appear here.
              </p>
            ) : (
              <ul className="grid grid-cols-2 gap-px bg-line sm:grid-cols-3 lg:grid-cols-2">
                {evidenceFiles.map((file) => {
                  const url = signedUrlByPath.get(file.storage_path);
                  return (
                    <li key={file.id} className="bg-surface">
                      <div className="aspect-[4/3] overflow-hidden bg-surface-3">
                        {url ? (
                          <img
                            src={url}
                            alt={file.caption || file.original_filename}
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="grid h-full place-items-center text-faint">
                            <Camera size={18} aria-hidden="true" />
                          </span>
                        )}
                      </div>
                      <p className="truncate px-2.5 py-2 text-[11.5px] font-medium text-body">
                        {file.caption || file.original_filename}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
