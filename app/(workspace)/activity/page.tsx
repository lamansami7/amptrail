import type { Metadata } from 'next';
import { History } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { WorkspaceDataNotice } from '@/components/workspace/data-notice';
import { requireWorkspace } from '@/lib/data/workspace';
import { formatDate, formatRelative } from '@/lib/utils';

export const metadata: Metadata = { title: 'Activity' };

const PAGE_SIZE = 100;

function dayLabel(value: string) {
  return formatDate(value, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

export default async function ActivityPage() {
  const { supabase, workspace } = await requireWorkspace();

  const { data: events, error } = await supabase
    .from('activity_events')
    .select('id, event_type, description, created_at')
    .eq('company_id', workspace.id)
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE);

  const header = (
    <PageHeader
      eyebrow="Workspace"
      title="Activity"
      description="A running history of ticket, project and evidence changes in this workspace."
    />
  );

  if (error) {
    return (
      <div className="space-y-6">
        {header}
        <WorkspaceDataNotice />
      </div>
    );
  }

  if (!events?.length) {
    return (
      <div className="space-y-6">
        {header}
        <EmptyState
          icon={<History size={20} aria-hidden="true" />}
          title="No activity yet"
          description="Create a project or a work ticket and the change will be recorded here."
        />
      </div>
    );
  }

  const groups: Array<{ label: string; items: typeof events }> = [];
  for (const event of events) {
    const label = dayLabel(event.created_at);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(event);
    else groups.push({ label, items: [event] });
  }

  return (
    <div className="space-y-6">
      {header}

      <div className="space-y-5">
        {groups.map((group) => (
          <section key={group.label} aria-label={group.label}>
            <h2 className="mb-2 px-1 text-[12px] font-semibold uppercase tracking-[0.08em] text-subtle">
              {group.label}
            </h2>
            <Card flush>
              <ul className="divide-y divide-line">
                {group.items.map((event) => (
                  <li key={event.id} className="flex items-start gap-3 px-4 py-3 sm:px-5">
                    <span
                      aria-hidden="true"
                      className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand-500"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] leading-6 text-body">{event.description}</p>
                      <p className="text-[11.5px] text-subtle">
                        <span className="font-mono">{event.event_type}</span>
                        <span aria-hidden="true"> · </span>
                        <time dateTime={event.created_at}>{formatRelative(event.created_at)}</time>
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </section>
        ))}
      </div>

      {events.length === PAGE_SIZE && (
        <p className="text-center text-[12.5px] text-muted">
          Showing the most recent {PAGE_SIZE} events.
        </p>
      )}
    </div>
  );
}
