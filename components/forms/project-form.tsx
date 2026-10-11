'use client';

import { useActionState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { Button, ButtonLink } from '@/components/ui/button';
import type { ActionState } from '@/lib/actions/projects';

type ProjectFormAction = (state: ActionState, formData: FormData) => Promise<ActionState>;
type ProjectValues = {
  id?: string;
  name?: string;
  project_number?: string | null;
  site_address?: string | null;
  general_contractor?: string | null;
  notes?: string | null;
};

export function ProjectForm({
  action,
  project,
  cancelHref,
}: {
  action: ProjectFormAction;
  project?: ProjectValues;
  cancelHref: string;
}) {
  const [state, formAction, pending] = useActionState(action, {} as ActionState);

  return (
    <form action={formAction} className="card space-y-6 p-6 sm:p-8">
      {project?.id && <input type="hidden" name="id" value={project.id} />}

      {state.error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-800" role="alert">
          {state.error}
        </div>
      )}

      {/* Project Name */}
      <div>
        <label className="field-label" htmlFor="name">
          Project Name <span className="text-blue-600">*</span>
        </label>
        <div className="relative">
          <input
            className="field-control"
            id="name"
            name="name"
            required
            maxLength={180}
            defaultValue={project?.name || ''}
            placeholder="e.g. Metro Medical Center — East Tower Remodel"
          />
        </div>
        <p className="field-hint">The primary commercial project or job name used on tickets and PDF exports.</p>
      </div>

      {/* Grid: Project Number and GC */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="project_number">
            Project / Job #
          </label>
          <div className="relative">
            <input
              className="field-control"
              id="project_number"
              name="project_number"
              maxLength={80}
              defaultValue={project?.project_number || ''}
              placeholder="e.g. PRJ-2026-088"
            />
          </div>
          <p className="field-hint">Your internal job number or GC contract reference.</p>
        </div>

        <div>
          <label className="field-label" htmlFor="general_contractor">
            General Contractor
          </label>
          <div className="relative">
            <input
              className="field-control"
              id="general_contractor"
              name="general_contractor"
              maxLength={180}
              defaultValue={project?.general_contractor || ''}
              placeholder="e.g. Turner Construction / DPR"
            />
          </div>
          <p className="field-hint">The prime contractor managing the jobsite.</p>
        </div>
      </div>

      {/* Jobsite Address */}
      <div>
        <label className="field-label" htmlFor="site_address">
          Jobsite Address
        </label>
        <div className="relative">
          <input
            className="field-control"
            id="site_address"
            name="site_address"
            maxLength={500}
            defaultValue={project?.site_address || ''}
            placeholder="e.g. 100 Innovation Way, Suite 400, Chicago, IL 60601"
          />
        </div>
        <p className="field-hint">Physical location of the electrical work.</p>
      </div>

      {/* Project Notes */}
      <div>
        <label className="field-label" htmlFor="notes">
          Project Scope Notes
        </label>
        <textarea
          className="field-control min-h-28 resize-y"
          id="notes"
          name="notes"
          maxLength={10000}
          defaultValue={project?.notes || ''}
          placeholder="Important job notes, overtime authorizations, billing cycle cutoffs, or customer contact numbers..."
        />
        <p className="field-hint">Internal reference notes for your team.</p>
      </div>

      {/* Actions */}
      <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
        <ButtonLink href={cancelHref} variant="secondary">
          Cancel
        </ButtonLink>
        <Button type="submit" disabled={pending} className="min-w-36">
          {pending && <LoaderCircle size={15} className="animate-spin" />}
          {pending ? 'Saving Project…' : project ? 'Save Changes' : 'Create Project'}
        </Button>
      </div>
    </form>
  );
}
