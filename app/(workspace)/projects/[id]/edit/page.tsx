import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { WorkspaceDataNotice } from '@/components/workspace/data-notice';
import { ProjectForm } from '@/components/forms/project-form';
import { updateProjectAction } from '@/lib/actions/projects';
import { requireWorkspace } from '@/lib/data/workspace';

export const metadata: Metadata = { title: 'Edit project' };

type Props = { params: Promise<{ id: string }> };

export default async function EditProjectPage({ params }: Props) {
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
        <PageHeader title="Edit project" />
        <WorkspaceDataNotice />
      </div>
    );
  }
  if (!project) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href={`/projects/${project.id}`}
        className="inline-flex min-h-9 items-center gap-1.5 rounded-lg text-[13px] font-medium text-muted transition-colors duration-150 hover:text-ink"
      >
        <ArrowLeft size={15} aria-hidden="true" />
        Back to {project.name}
      </Link>

      <PageHeader
        eyebrow="Project settings"
        title="Edit project"
        description="Changes apply to new tickets and exports. Records already created keep the details they were saved with."
      />

      <ProjectForm
        action={updateProjectAction}
        project={project}
        cancelHref={`/projects/${project.id}`}
      />
    </div>
  );
}
