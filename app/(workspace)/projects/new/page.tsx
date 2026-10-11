import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { ProjectForm } from '@/components/forms/project-form';
import { createProjectAction } from '@/lib/actions/projects';

export const metadata: Metadata = { title: 'New project' };

export default function NewProjectPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/projects"
        className="inline-flex min-h-9 items-center gap-1.5 rounded-lg text-[13px] font-medium text-muted transition-colors duration-150 hover:text-ink"
      >
        <ArrowLeft size={15} aria-hidden="true" />
        All projects
      </Link>

      <PageHeader
        eyebrow="New project"
        title="Add a jobsite"
        description="Set the job up once. Every ticket, photo and export for this jobsite will use these details."
      />

      <ProjectForm action={createProjectAction} cancelHref="/projects" />
    </div>
  );
}
