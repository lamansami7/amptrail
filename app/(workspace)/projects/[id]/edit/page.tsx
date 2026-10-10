import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageHeader, DataSetupMessage } from '@/components/workspace/app-page';
import { ProjectForm } from '@/components/forms/project-form';
import { updateProjectAction } from '@/lib/actions/projects';
import { requireWorkspace } from '@/lib/data/workspace';

export const metadata: Metadata = { title: 'Edit project' };

type Props = { params: Promise<{ id: string }> };

export default async function EditProjectPage({ params }: Props) {
  const { id } = await params;
  const { supabase, workspace } = await requireWorkspace();
  const { data: project, error } = await supabase.from('projects').select('*').eq('id', id).eq('company_id', workspace.id).maybeSingle();
  if (error) return <><PageHeader title="Edit project" /><DataSetupMessage /></>;
  if (!project) notFound();
  return <div className="mx-auto max-w-3xl"><PageHeader eyebrow="Project settings" title="Edit project" description="Keep the job information accurate for future work records." /><ProjectForm action={updateProjectAction} project={project} cancelHref={`/projects/${project.id}`} /></div>;
}
