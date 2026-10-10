'use client';

import { useActionState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { Button, ButtonLink } from '@/components/ui/button';
import type { ActionState } from '@/lib/actions/projects';

type ProjectFormAction = (state: ActionState, formData: FormData) => Promise<ActionState>;
type ProjectValues = { id?: string; name?: string; project_number?: string | null; site_address?: string | null; general_contractor?: string | null; notes?: string | null };

export function ProjectForm({ action, project, cancelHref }: { action: ProjectFormAction; project?: ProjectValues; cancelHref: string }) {
  const [state, formAction, pending] = useActionState(action, {} as ActionState);
  return <form action={formAction} className="card space-y-5 p-5 sm:p-7">
    {project?.id && <input type="hidden" name="id" value={project.id} />}
    {state.error && <p className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-800" role="alert">{state.error}</p>}
    <div><label className="field-label" htmlFor="name">Project name <span className="text-orange">*</span></label><input className="field-control" id="name" name="name" required maxLength={180} defaultValue={project?.name || ''} placeholder="Example: North wing renovation" /></div>
    <div className="grid gap-5 sm:grid-cols-2">
      <div><label className="field-label" htmlFor="project_number">Project number</label><input className="field-control" id="project_number" name="project_number" maxLength={80} defaultValue={project?.project_number || ''} placeholder="Optional" /></div>
      <div><label className="field-label" htmlFor="general_contractor">General contractor</label><input className="field-control" id="general_contractor" name="general_contractor" maxLength={180} defaultValue={project?.general_contractor || ''} placeholder="Company or contact" /></div>
    </div>
    <div><label className="field-label" htmlFor="site_address">Jobsite address</label><input className="field-control" id="site_address" name="site_address" maxLength={500} defaultValue={project?.site_address || ''} placeholder="Street, city, state" /></div>
    <div><label className="field-label" htmlFor="notes">Project notes</label><textarea className="field-control min-h-28 resize-y" id="notes" name="notes" maxLength={10000} defaultValue={project?.notes || ''} placeholder="Anything your team should know about this job" /></div>
    <div className="flex flex-col-reverse gap-3 border-t border-line pt-5 sm:flex-row sm:justify-end">
      <ButtonLink href={cancelHref} variant="secondary">Cancel</ButtonLink>
      <Button type="submit" disabled={pending}>{pending && <LoaderCircle size={16} className="animate-spin" />}{pending ? 'Saving…' : project ? 'Save changes' : 'Create project'}</Button>
    </div>
  </form>;
}
