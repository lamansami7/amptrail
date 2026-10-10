import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PageHeader, DataSetupMessage } from '@/components/workspace/app-page';
import { ButtonLink } from '@/components/ui/button';
import { TicketEditor } from '@/components/tickets/ticket-editor';
import { requireWorkspace } from '@/lib/data/workspace';

export const metadata: Metadata = { title: 'New work ticket' };
type Props = { searchParams: Promise<{ projectId?: string }> };

export default async function NewTicketPage({ searchParams }: Props) {
  const { projectId } = await searchParams;
  const { supabase, workspace } = await requireWorkspace();
  const { data: projects, error } = await supabase.from('projects').select('id, name, project_number').eq('company_id', workspace.id).eq('is_archived', false).order('name');
  if (error) return <><PageHeader title="New work ticket" /><DataSetupMessage /></>;
  const preferredProject = projects?.some((project) => project.id === projectId) ? projectId : undefined;
  if (!projects?.length) return <div className="mx-auto max-w-3xl"><PageHeader eyebrow="Work tickets" title="Create a ticket" description="A ticket needs an active project so the work record has a home." /><div className="rounded-2xl border border-amber-200 bg-amber-50 p-5"><p className="font-bold text-ink">Add a project first</p><p className="mt-1 text-sm leading-6 text-muted">Create an active project, then return here to document the extra work.</p><ButtonLink href="/projects/new" className="mt-4">Create project</ButtonLink></div></div>;
  return <div className="mx-auto max-w-4xl">
    <div className="mb-3"><Link href="/tickets" className="inline-flex min-h-9 items-center gap-2 text-sm font-semibold text-muted hover:text-ink"><ArrowLeft size={16} />Work tickets</Link></div>
    <PageHeader eyebrow="Field record" title="Create a work ticket" description="Document what happened, where it happened, and what it took. You can add evidence after saving." />
    <TicketEditor projects={projects} ticket={preferredProject ? { project_id: preferredProject } : undefined} />
  </div>;
}
