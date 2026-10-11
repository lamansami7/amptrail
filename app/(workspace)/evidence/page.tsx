import type { Metadata } from 'next';
import Link from 'next/link';
import { Camera, ImagePlus, ReceiptText } from 'lucide-react';
import { requireWorkspace } from '@/lib/data/workspace';
import { WorkspaceDataNotice } from '@/components/workspace/data-notice';
import { PageHeader } from '@/components/ui/page-header';
import { ButtonLink } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { EvidenceCapture } from '@/components/evidence/evidence-capture';
import type { EvidenceView } from '@/components/evidence/evidence-panel';
import { formatDate, pluralize } from '@/lib/utils';

export const metadata: Metadata = { title: 'Evidence' };

export default async function EvidencePage() {
  const { supabase, user, workspace } = await requireWorkspace();

  const [{ data: projects, error: projectError }, { data: evidence, error: evidenceError }] =
    await Promise.all([
      supabase
        .from('projects')
        .select('id, name, is_archived')
        .eq('company_id', workspace.id)
        .order('name'),
      supabase
        .from('evidence_files')
        .select('*')
        .eq('company_id', workspace.id)
        .order('created_at', { ascending: false })
        .limit(100),
    ]);

  if (projectError || evidenceError) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Jobsite photos"
          title="Evidence"
          description="Photos and field notes, attached to a project or a specific ticket."
        />
        <WorkspaceDataNotice />
      </div>
    );
  }

  const activeProjects = (projects ?? []).filter((project) => !project.is_archived);

  const ticketsResult = activeProjects.length
    ? await supabase
        .from('work_tickets')
        .select('id, project_id, ticket_number')
        .eq('company_id', workspace.id)
        .in(
          'project_id',
          activeProjects.map((project) => project.id)
        )
        .order('occurred_at', { ascending: false })
    : { data: [], error: null };

  if (ticketsResult.error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Evidence" />
        <WorkspaceDataNotice />
      </div>
    );
  }

  const projectNameById = new Map((projects ?? []).map((project) => [project.id, project.name]));
  const ticketNumberById = new Map(
    (ticketsResult.data ?? []).map((ticket) => [ticket.id, ticket.ticket_number])
  );

  const evidenceRows = evidence ?? [];
  const signedEvidence = evidenceRows.length
    ? await supabase.storage
        .from('evidence')
        .createSignedUrls(
          evidenceRows.map((item) => item.storage_path),
          3600
        )
    : { data: [], error: null };
  const signedUrlByPath = new Map(
    (signedEvidence.data ?? []).map((item) => [item.path ?? '', item.signedUrl])
  );

  const captureEvidence: Array<EvidenceView & { project_id: string; ticket_id: string | null }> =
    evidenceRows.map((item) => ({
      ...item,
      signedUrl: signedUrlByPath.get(item.storage_path) ?? null,
      canDelete: item.uploaded_by === user.id,
    }));

  const recent = captureEvidence.slice(0, 12);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Jobsite photos"
        title="Evidence"
        description="Attach photographic proof to the work it belongs to, while the conditions are still visible."
        meta={
          captureEvidence.length > 0 ? (
            <span className="text-[13px] text-muted">
              {pluralize(captureEvidence.length, 'photo')} across{' '}
              {pluralize(activeProjects.length, 'active project')}
            </span>
          ) : undefined
        }
      />

      {activeProjects.length === 0 ? (
        <EmptyState
          icon={<Camera size={20} aria-hidden="true" />}
          title="Add a project before uploading photos"
          description="Evidence is stored under a project so photos stay organized by jobsite and scoped to your company."
          action={
            <ButtonLink href="/projects/new">
              <ImagePlus size={16} aria-hidden="true" />
              Create a project
            </ButtonLink>
          }
        />
      ) : (
        <EvidenceCapture
          companyId={workspace.id}
          projects={activeProjects.map(({ id, name }) => ({ id, name }))}
          tickets={ticketsResult.data ?? []}
          evidence={captureEvidence}
        />
      )}

      {recent.length > 0 && (
        <Card flush>
          <CardHeader
            title="Recent workspace photos"
            description={`The ${recent.length === 1 ? 'latest capture' : `${recent.length} latest captures`} across every active project`}
            bordered
          />
          <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {recent.map((item) => (
              <li key={item.id} className="bg-surface outline outline-1 -outline-offset-1 outline-line">
                <div className="aspect-[4/3] overflow-hidden bg-surface-3">
                  {item.signedUrl ? (
                    <img
                      src={item.signedUrl}
                      alt={item.caption || item.original_filename}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="grid h-full place-items-center text-faint">
                      <Camera size={18} aria-hidden="true" />
                    </span>
                  )}
                </div>
                <div className="px-3 py-2.5">
                  <p className="truncate text-[12.5px] font-medium text-ink">
                    {item.caption || item.original_filename}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-subtle">
                    {projectNameById.get(item.project_id) ?? 'Project'} ·{' '}
                    {formatDate(item.created_at)}
                  </p>
                  {item.ticket_id && ticketNumberById.get(item.ticket_id) && (
                    <Link
                      href={`/tickets/${item.ticket_id}`}
                      className="link mt-1.5 inline-flex items-center gap-1 font-mono text-[11px]"
                    >
                      <ReceiptText size={11} aria-hidden="true" />
                      {ticketNumberById.get(item.ticket_id)}
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <p className="rounded-xl border border-line bg-surface-2/70 px-4 py-3 text-[12px] leading-5 text-muted">
        <strong className="font-semibold text-body">Private by design:</strong> evidence is stored in
        a private bucket and only reachable through short-lived signed links issued to members of
        your company. There are no public photo URLs.
      </p>
    </div>
  );
}
