import type { Metadata } from 'next';
import Link from 'next/link';
import { Camera, Inbox, Plus, Search } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { ButtonLink } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { WorkspaceDataNotice } from '@/components/workspace/data-notice';
import { SubmissionStatusBadge } from '@/components/inbox/submission-status-badge';
import { requireWorkspace } from '@/lib/data/workspace';
import {
  openSubmissionStatuses,
  submissionExcerpt,
  submissionStatusLabel,
  type SubmissionStatus,
} from '@/lib/inbox/status';
import { cn, formatRelative, pluralize } from '@/lib/utils';

export const metadata: Metadata = { title: 'Inbox' };

const PAGE_LIMIT = 200;
const filters = ['open', 'new', 'needs_project', 'missing_details', 'ready_for_review', 'processed', 'dismissed', 'all'] as const;
type Filter = (typeof filters)[number];

type Props = { searchParams: Promise<{ status?: string; q?: string }> };

export default async function InboxPage({ searchParams }: Props) {
  const params = await searchParams;
  const filter: Filter = filters.includes(params.status as Filter) ? (params.status as Filter) : 'open';
  const query = (params.q ?? '').trim().slice(0, 100);
  const { supabase, workspace } = await requireWorkspace();

  const [submissionsRes, projectsRes, attachmentsRes] = await Promise.all([
    supabase
      .from('field_submissions')
      .select('id, sender_name, body, received_at, project_id, status, source')
      .eq('company_id', workspace.id)
      .order('received_at', { ascending: false })
      .limit(PAGE_LIMIT),
    supabase.from('projects').select('id, name').eq('company_id', workspace.id),
    supabase.from('submission_attachments').select('submission_id').eq('company_id', workspace.id).limit(2000),
  ]);

  const header = (
    <PageHeader
      eyebrow="Workspace"
      title="Inbox"
      description="Field notes and photos waiting for office review. Nothing here becomes a ticket until a person reviews it."
      action={
        <ButtonLink href="/inbox/new">
          <Plus size={15} aria-hidden="true" />
          Log a field note
        </ButtonLink>
      }
    />
  );

  if (submissionsRes.error) {
    const missingTable = ['42P01', 'PGRST205', 'PGRST200'].includes(submissionsRes.error.code ?? '');
    return (
      <div className="space-y-6">
        {header}
        {missingTable ? (
          <Alert tone="warning" title="The inbox needs a database update">
            Apply <code className="font-mono text-[12px]">202610150001_field_submissions_inbox.sql</code> to your
            Supabase project (see the README), then reload this page.
          </Alert>
        ) : (
          <WorkspaceDataNotice />
        )}
      </div>
    );
  }

  const submissions = submissionsRes.data ?? [];
  const projectNames = new Map((projectsRes.data ?? []).map((project) => [project.id, project.name]));
  const photoCounts = new Map<string, number>();
  for (const row of attachmentsRes.data ?? []) {
    photoCounts.set(row.submission_id, (photoCounts.get(row.submission_id) ?? 0) + 1);
  }

  const counts: Record<string, number> = { all: submissions.length, open: 0 };
  for (const submission of submissions) {
    counts[submission.status] = (counts[submission.status] ?? 0) + 1;
    if (openSubmissionStatuses.includes(submission.status as SubmissionStatus)) counts.open += 1;
  }

  const needle = query.toLowerCase();
  const visible = submissions.filter((submission) => {
    if (filter === 'open') {
      if (!openSubmissionStatuses.includes(submission.status as SubmissionStatus)) return false;
    } else if (filter !== 'all' && submission.status !== filter) {
      return false;
    }
    if (!needle) return true;
    const project = submission.project_id ? projectNames.get(submission.project_id) ?? '' : '';
    return [submission.body, submission.sender_name ?? '', project].some((text) => text.toLowerCase().includes(needle));
  });

  const tabHref = (value: Filter) => {
    const search = new URLSearchParams();
    if (value !== 'open') search.set('status', value);
    if (query) search.set('q', query);
    const text = search.toString();
    return text ? `/inbox?${text}` : '/inbox';
  };
  const tabLabel = (value: Filter) =>
    value === 'open' ? 'Open' : value === 'all' ? 'All' : submissionStatusLabel(value);

  return (
    <div className="space-y-6">
      {header}

      <Alert tone="info" title="Notes are logged by your team">
        Phone text and photo intake is not connected yet, so every note here was typed in through the web app.
        Originals are kept exactly as entered.
      </Alert>

      <div className="space-y-3">
        <nav aria-label="Filter by status" className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
          {filters.map((value) => {
            const active = value === filter;
            return (
              <Link
                key={value}
                href={tabHref(value)}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-[13px] font-semibold transition-colors',
                  active
                    ? 'border-brand-line bg-brand-50 text-brand-800'
                    : 'border-transparent text-muted hover:bg-surface-3 hover:text-ink'
                )}
              >
                {tabLabel(value)}
                <span className="rounded-full bg-surface-3 px-1.5 text-[11px] text-subtle">{counts[value] ?? 0}</span>
              </Link>
            );
          })}
        </nav>

        <form action="/inbox" method="get" role="search" className="flex max-w-md items-center gap-2">
          {filter !== 'open' && <input type="hidden" name="status" value={filter} />}
          <label htmlFor="inbox-search" className="sr-only">
            Search notes
          </label>
          <div className="relative flex-1">
            <Search size={15} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
            <input
              id="inbox-search"
              name="q"
              defaultValue={query}
              placeholder="Search notes, senders, projects"
              className="field-control pl-9"
              maxLength={100}
            />
          </div>
          <button type="submit" className="min-h-10 rounded-lg border border-line-strong bg-surface px-3 text-[13px] font-semibold text-ink-soft hover:bg-surface-2">
            Search
          </button>
        </form>
      </div>

      {submissions.length === 0 ? (
        <EmptyState
          icon={<Inbox size={20} aria-hidden="true" />}
          title="No field notes yet"
          description="When a foreman reports extra work, log the note here with any photos. The office can then assign a project, ask for what is missing, and turn it into a ticket."
          action={<ButtonLink href="/inbox/new">Log your first field note</ButtonLink>}
        />
      ) : visible.length === 0 ? (
        <EmptyState
          tone="neutral"
          icon={<Search size={20} aria-hidden="true" />}
          title="Nothing matches"
          description={query ? `No ${filter === 'all' ? '' : tabLabel(filter).toLowerCase() + ' '}notes match “${query}”.` : `There are no ${tabLabel(filter).toLowerCase()} notes.`}
          action={
            <ButtonLink href="/inbox" variant="secondary">
              Show open notes
            </ButtonLink>
          }
        />
      ) : (
        <Card flush>
          <ul className="divide-y divide-line">
            {visible.map((submission) => {
              const photos = photoCounts.get(submission.id) ?? 0;
              const projectName = submission.project_id ? projectNames.get(submission.project_id) : null;
              return (
                <li key={submission.id}>
                  <Link
                    href={`/inbox/${submission.id}`}
                    className="block px-4 py-4 transition-colors hover:bg-surface-2/70 focus-visible:bg-surface-2 sm:px-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[13.5px] font-semibold text-ink">
                        {submission.sender_name || 'Field note'}
                      </p>
                      <div className="flex items-center gap-2.5">
                        <SubmissionStatusBadge status={submission.status} />
                        <time dateTime={submission.received_at} className="text-[12px] text-muted">
                          {formatRelative(submission.received_at)}
                        </time>
                      </div>
                    </div>
                    <p className="mt-1 text-[13.5px] leading-6 text-body">{submissionExcerpt(submission.body)}</p>
                    <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted">
                      <span className={projectName ? 'font-medium text-body' : 'italic'}>
                        {projectName ?? 'No project assigned'}
                      </span>
                      {photos > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <Camera size={12} aria-hidden="true" />
                          {pluralize(photos, 'photo')}
                        </span>
                      )}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      {submissions.length === PAGE_LIMIT && (
        <p className="text-center text-[12.5px] text-muted">Showing the {PAGE_LIMIT} most recent notes.</p>
      )}
    </div>
  );
}
