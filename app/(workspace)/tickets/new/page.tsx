import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, FolderPlus } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { WorkspaceDataNotice } from '@/components/workspace/data-notice';
import { Alert } from '@/components/ui/alert';
import { ButtonLink } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { TicketEditor } from '@/components/tickets/ticket-editor';
import { requireWorkspace } from '@/lib/data/workspace';

export const metadata: Metadata = { title: 'New work ticket' };

type Props = { searchParams: Promise<{ projectId?: string }> };

export default async function NewTicketPage({ searchParams }: Props) {
  const { projectId } = await searchParams;
  const { supabase, workspace } = await requireWorkspace();

  const { data: projects, error } = await supabase
    .from('projects')
    .select('id, name, project_number')
    .eq('company_id', workspace.id)
    .eq('is_archived', false)
    .order('name');

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="New work ticket" />
        <WorkspaceDataNotice />
      </div>
    );
  }

  if (!projects?.length) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <PageHeader
          eyebrow="Work tickets"
          title="Create a ticket"
          description="Every ticket belongs to a jobsite, so a project comes first."
        />
        <EmptyState
          icon={<FolderPlus size={20} aria-hidden="true" />}
          title="No active projects yet"
          description="Add the project this extra work belongs to, then come back and document the hours, materials and photos."
          action={
            <ButtonLink href="/projects/new">
              <FolderPlus size={15} aria-hidden="true" />
              Create a project
            </ButtonLink>
          }
        />
      </div>
    );
  }

  const preferredProject = projects.some((project) => project.id === projectId)
    ? projectId
    : undefined;

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <Link
        href="/tickets"
        className="inline-flex min-h-9 items-center gap-1.5 rounded-lg text-[13px] font-medium text-muted transition-colors duration-150 hover:text-ink"
      >
        <ArrowLeft size={15} aria-hidden="true" />
        All work tickets
      </Link>

      <PageHeader
        eyebrow="New record"
        title="Create a work ticket"
        description="Document what happened, where, and what it took. You can attach photos and export a PDF as soon as it is saved."
      />

      <Alert tone="info">
        Totals recalculate as you type, and nothing is saved until you choose{' '}
        <strong className="font-semibold">Create work ticket</strong>.
      </Alert>

      <TicketEditor
        projects={projects}
        ticket={preferredProject ? { project_id: preferredProject } : undefined}
      />
    </div>
  );
}
