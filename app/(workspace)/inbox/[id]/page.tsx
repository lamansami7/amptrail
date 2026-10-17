import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AlertCircle, ArrowLeft, Camera, FilePlus2, Lock, MessageSquareText } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { ButtonLink } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { WorkspaceDataNotice } from '@/components/workspace/data-notice';
import { AddPhotos } from '@/components/inbox/add-photos';
import { SubmissionStatusBadge } from '@/components/inbox/submission-status-badge';
import { TriagePanel } from '@/components/inbox/triage-panel';
import { requireWorkspace } from '@/lib/data/workspace';
import type { SubmissionStatus } from '@/lib/inbox/status';
import { formatDateTime, formatRelative, pluralize } from '@/lib/utils';

export const metadata: Metadata = { title: 'Field note' };

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Props = { params: Promise<{ id: string }> };

export default async function SubmissionDetailPage({ params }: Props) {
  const { id } = await params;
  if (!uuidPattern.test(id)) notFound();
  const { supabase, user, workspace } = await requireWorkspace();

  const { data: submission, error } = await supabase
    .from('field_submissions')
    .select('*')
    .eq('id', id)
    .eq('company_id', workspace.id)
    .maybeSingle();

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Field note" />
        <WorkspaceDataNotice />
      </div>
    );
  }
  if (!submission) notFound();

  const [attachmentsRes, projectsRes, ticketRes] = await Promise.all([
    supabase
      .from('submission_attachments')
      .select('id, storage_path, original_filename, size_bytes, created_at')
      .eq('submission_id', submission.id)
      .eq('company_id', workspace.id)
      .order('created_at', { ascending: true }),
    supabase
      .from('projects')
      .select('id, name, project_number, is_archived')
      .eq('company_id', workspace.id)
      .order('name'),
    submission.ticket_id
      ? supabase
          .from('work_tickets')
          .select('id, ticket_number')
          .eq('id', submission.ticket_id)
          .eq('company_id', workspace.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const attachments = attachmentsRes.data ?? [];
  const projects = projectsRes.data ?? [];
  const activeProjects = projects.filter((project) => !project.is_archived);
  const project = projects.find((item) => item.id === submission.project_id) ?? null;
  const ticket = ticketRes.data;

  // Private photos are shown through short-lived signed links, in request order.
  const signed = attachments.length
    ? await supabase.storage.from('evidence').createSignedUrls(
        attachments.map((item) => item.storage_path),
        3600
      )
    : { data: [] as Array<{ signedUrl: string }> };
  const urls = attachments.map((_, index) => signed.data?.[index]?.signedUrl ?? null);

  const closed = submission.status === 'processed';
  const isSubmitter = submission.submitted_by === user.id;
  const sender = submission.sender_name || 'Field note';

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <Link
        href="/inbox"
        className="inline-flex min-h-9 items-center gap-1.5 rounded-lg text-[13px] font-medium text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft size={15} aria-hidden="true" />
        Inbox
      </Link>

      <PageHeader
        eyebrow="Field note"
        title={sender}
        description={
          <>
            Received <time dateTime={submission.received_at}>{formatDateTime(submission.received_at)}</time> (
            {formatRelative(submission.received_at)}), typed in through the web app.
          </>
        }
        meta={<SubmissionStatusBadge status={submission.status} />}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-5">
          {/* Conversation view: the original, then what the office has flagged. */}
          <Card className="p-5 sm:p-6">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-subtle">
              <MessageSquareText size={13} aria-hidden="true" />
              Original note, as entered
            </p>
            <div className="mt-3 max-w-[42rem] rounded-2xl rounded-tl-md border border-line bg-surface-2/70 px-4 py-3">
              <p className="whitespace-pre-wrap break-words text-[14px] leading-7 text-ink">{submission.body}</p>
            </div>
            <p className="mt-3 flex items-start gap-1.5 text-[12px] leading-5 text-muted">
              <Lock size={13} className="mt-0.5 shrink-0 text-brand-700" aria-hidden="true" />
              The wording, sender and time cannot be edited. Corrections happen on the ticket, not here.
            </p>

            {submission.status === 'missing_details' && submission.missing_details && (
              <div className="mt-5 flex justify-end">
                <div className="max-w-[34rem] rounded-2xl rounded-tr-md border border-violet-200 bg-violet-50 px-4 py-3">
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-violet-700">
                    <AlertCircle size={13} aria-hidden="true" />
                    Office follow-up needed
                  </p>
                  <p className="mt-1.5 whitespace-pre-wrap break-words text-[13.5px] leading-6 text-violet-900">
                    {submission.missing_details}
                  </p>
                </div>
              </div>
            )}
          </Card>

          <Card flush>
            <CardHeader
              title={attachments.length ? pluralize(attachments.length, 'photo') : 'Photos'}
              icon={<Camera size={16} aria-hidden="true" />}
              bordered
            />
            <div className="space-y-4 p-5">
              {attachments.length === 0 ? (
                <p className="text-[13px] text-muted">No photos were attached to this note.</p>
              ) : (
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {attachments.map((item, index) => (
                    <li key={item.id}>
                      {urls[index] ? (
                        <a
                          href={urls[index]!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group block overflow-hidden rounded-lg border border-line bg-surface-3 focus-visible:ring-2 focus-visible:ring-brand-500"
                        >
                          <img
                            src={urls[index]!}
                            alt={`Photo ${index + 1} from this field note: ${item.original_filename}`}
                            loading="lazy"
                            className="aspect-[4/3] w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                          />
                        </a>
                      ) : (
                        <div className="grid aspect-[4/3] place-items-center rounded-lg border border-dashed border-line-strong bg-surface-2 px-2 text-center text-[11.5px] text-muted">
                          Preview unavailable
                        </div>
                      )}
                      <p className="mt-1 truncate text-[11.5px] text-muted">{item.original_filename}</p>
                    </li>
                  ))}
                </ul>
              )}

              {!closed && isSubmitter && attachments.length < 10 && (
                <div className="border-t border-line pt-4">
                  <p className="mb-2 text-[12.5px] font-semibold text-ink">Add photos</p>
                  <AddPhotos companyId={workspace.id} submissionId={submission.id} attached={attachments.length} />
                </div>
              )}
              {!closed && !isSubmitter && (
                <p className="border-t border-line pt-3 text-[12px] text-muted">
                  Only the person who logged this note can add photos to it.
                </p>
              )}
            </div>
          </Card>
        </div>

        <aside aria-label="Note review" className="space-y-5">
          {closed ? (
            <Card flush>
              <CardHeader title="Closed" bordered />
              <div className="space-y-3 p-5 text-[13px] leading-6 text-body">
                <p>This note was turned into a work ticket. The original stays on file.</p>
                {ticket ? (
                  <ButtonLink href={`/tickets/${ticket.id}`} variant="secondary" size="sm">
                    Open {ticket.ticket_number}
                  </ButtonLink>
                ) : (
                  <p className="text-muted">The linked ticket is no longer available.</p>
                )}
                {project && <p className="text-muted">Project: {project.name}</p>}
              </div>
            </Card>
          ) : (
            <>
              <Card flush>
                <CardHeader title="Review" bordered />
                <div className="p-5">
                  <TriagePanel
                    submissionId={submission.id}
                    status={submission.status as SubmissionStatus}
                    projectId={submission.project_id}
                    missingDetails={submission.missing_details}
                    projects={activeProjects}
                  />
                  {project?.is_archived && (
                    <p className="mt-3 text-[12px] text-warning">
                      This note’s project, {project.name}, is archived. Choose an active project to continue.
                    </p>
                  )}
                </div>
              </Card>

              <Card flush>
                <CardHeader title="Next step" bordered />
                <div className="space-y-3 p-5">
                  <p className="text-[13px] leading-6 text-muted">
                    Start a work ticket from this note. The original wording becomes the starting description for you
                    to edit. Nothing is filled in for you: hours, quantities and rates are entered by a person.
                  </p>
                  <ButtonLink href={`/tickets/new?submission=${submission.id}`} className="w-full">
                    <FilePlus2 size={15} aria-hidden="true" />
                    Create work ticket
                  </ButtonLink>
                </div>
              </Card>
            </>
          )}

          <p className="px-1 text-[11.5px] leading-5 text-subtle">
            {submission.handled_at
              ? `Last reviewed ${formatRelative(submission.handled_at)}.`
              : 'Not reviewed yet.'}
          </p>
        </aside>
      </div>

      {submission.status === 'dismissed' && (
        <Alert tone="info">This note is dismissed. Choose another status to reopen it.</Alert>
      )}
    </div>
  );
}
