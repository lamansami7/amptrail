import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { WorkspaceDataNotice } from '@/components/workspace/data-notice';
import { SubmissionForm } from '@/components/inbox/submission-form';
import { requireWorkspace } from '@/lib/data/workspace';

export const metadata: Metadata = { title: 'Log a field note' };

export default async function NewSubmissionPage() {
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
        <PageHeader title="Log a field note" />
        <WorkspaceDataNotice />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link
        href="/inbox"
        className="inline-flex min-h-9 items-center gap-1.5 rounded-lg text-[13px] font-medium text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft size={15} aria-hidden="true" />
        Inbox
      </Link>

      <PageHeader
        eyebrow="Inbox"
        title="Log a field note"
        description="Record what the crew reported, with any photos. The office reviews it before anything becomes a ticket."
      />

      <Alert tone="info">
        This is for notes you received some other way, such as a text, a call or a conversation. Type in only what you
        were told. Anything unclear can be flagged for follow-up afterwards.
      </Alert>

      <Card className="p-5 sm:p-6">
        <SubmissionForm companyId={workspace.id} projects={projects ?? []} defaultSender="" />
      </Card>
    </div>
  );
}
