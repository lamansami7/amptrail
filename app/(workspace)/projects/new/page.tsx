import type { Metadata } from 'next';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/workspace/app-page';
import { ButtonLink } from '@/components/ui/button';
import { ProjectForm } from '@/components/forms/project-form';
import { createProjectAction } from '@/lib/actions/projects';

export const metadata: Metadata = { title: 'New project' };

export default function NewProjectPage() {
  return <div className="mx-auto max-w-3xl">
    <PageHeader eyebrow="Projects" title="Add a project" description="Keep the job details together so field records can stay connected to the right work." action={<ButtonLink href="/projects" variant="quiet"><ArrowLeft size={16} />All projects</ButtonLink>} />
    <ProjectForm action={createProjectAction} cancelHref="/projects" />
  </div>;
}
