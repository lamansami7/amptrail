'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, MapPin, NotebookPen } from 'lucide-react';
import { Button, ButtonLink } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Card, CardHeader } from '@/components/ui/card';
import { Field, Input, Textarea } from '@/components/ui/field';
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
  const [dirty, setDirty] = useState(false);
  const discardDialogRef = useRef<HTMLDialogElement>(null);
  const discardCancelRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();
  const editing = Boolean(project?.id);

  // Protect against losing typed details on an accidental back/close.
  useEffect(() => {
    function onBeforeUnload(event: BeforeUnloadEvent) {
      if (dirty && !pending) {
        event.preventDefault();
        event.returnValue = '';
      }
    }
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty, pending]);

  // Never navigate away from typed details without an explicit confirmation.
  function requestLeave(event: React.MouseEvent<HTMLAnchorElement>) {
    if (!dirty || pending) return;
    event.preventDefault();
    requestAnimationFrame(() => discardDialogRef.current?.showModal());
    requestAnimationFrame(() => discardCancelRef.current?.focus());
  }

  function discardAndLeave() {
    setDirty(false);
    discardDialogRef.current?.close();
    router.push(cancelHref);
  }

  return (
    <form
      action={formAction}
      onChange={() => setDirty(true)}
      onSubmit={() => setDirty(false)}
      className="space-y-6"
    >
      {project?.id && <input type="hidden" name="id" value={project.id} />}

      {state.error && (
        <Alert tone="danger" role="alert" title="Project not saved">
          {state.error}
        </Alert>
      )}

      <Card flush>
        <CardHeader
          title="Project identity"
          description="How this job is named on tickets and exported records."
          icon={<Building2 size={16} aria-hidden="true" />}
          bordered
        />
        <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
          <Field
            id="name"
            label="Project name"
            required
            className="sm:col-span-2"
            hint="For example “Metro Medical Center — East Tower Remodel”."
          >
            {(props) => (
              <Input
                {...props}
                name="name"
                required
                maxLength={180}
                defaultValue={project?.name ?? ''}
                placeholder="Metro Medical Center — East Tower Remodel"
                autoFocus={!editing}
              />
            )}
          </Field>

          <Field id="project_number" label="Project / job number" optional hint="Your internal or GC reference number.">
            {(props) => (
              <Input
                {...props}
                name="project_number"
                maxLength={80}
                defaultValue={project?.project_number ?? ''}
                placeholder="PRJ-2026-088"
              />
            )}
          </Field>

          <Field id="general_contractor" label="General contractor" optional hint="The prime contractor on site.">
            {(props) => (
              <Input
                {...props}
                name="general_contractor"
                maxLength={180}
                defaultValue={project?.general_contractor ?? ''}
                placeholder="Turner Construction"
              />
            )}
          </Field>

          <Field
            id="site_address"
            label="Jobsite address"
            optional
            className="sm:col-span-2"
            hint="Used to identify the location on the record."
          >
            {(props) => (
              <Input
                {...props}
                name="site_address"
                maxLength={500}
                defaultValue={project?.site_address ?? ''}
                placeholder="100 Innovation Way, Chicago, IL 60601"
              />
            )}
          </Field>
        </div>
      </Card>

      <Card flush>
        <CardHeader
          title="Scope notes"
          description="Internal reference for your team. Not printed on tickets."
          icon={<NotebookPen size={16} aria-hidden="true" />}
          bordered
        />
        <div className="p-5 sm:p-6">
          <Field id="notes" label="Notes" optional>
            {(props) => (
              <Textarea
                {...props}
                name="notes"
                rows={4}
                maxLength={10000}
                defaultValue={project?.notes ?? ''}
                placeholder="Billing cut-off dates, site access rules, superintendent contacts, overtime authorisation…"
              />
            )}
          </Field>
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-line bg-surface-2/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-[12px] text-muted" role="status" aria-live="polite">
            {pending ? 'Saving…' : dirty ? 'Unsaved changes' : 'No unsaved changes'}
          </p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <ButtonLink
              href={cancelHref}
              variant="secondary"
              onClick={requestLeave}
              className="justify-center"
            >
              Cancel
            </ButtonLink>
            <Button type="submit" loading={pending} className="justify-center sm:min-w-36">
              {pending ? 'Saving…' : editing ? 'Save changes' : 'Create project'}
            </Button>
          </div>
        </div>
      </Card>

      <dialog
        ref={discardDialogRef}
        onClick={(event) => {
          if (event.target === discardDialogRef.current) discardDialogRef.current?.close();
        }}
        aria-labelledby="discard-project-title"
        className="m-auto w-[min(26rem,calc(100vw-2rem))] rounded-2xl border border-line bg-surface p-0 text-ink shadow-lg backdrop:bg-ink/40 backdrop:backdrop-blur-[2px]"
      >
        <div className="p-5 sm:p-6">
          <h2 id="discard-project-title" className="text-[1.0625rem] font-semibold tracking-[-0.012em] text-ink">
            Discard unsaved changes?
          </h2>
          <p className="mt-2 text-[13px] leading-6 text-muted">
            Edits to this project have not been saved. Leaving now discards them.
          </p>
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-line bg-surface-2/60 px-5 py-4 sm:flex-row sm:justify-end">
          <Button
            ref={discardCancelRef}
            type="button"
            variant="secondary"
            onClick={() => discardDialogRef.current?.close()}
          >
            Keep editing
          </Button>
          <Button type="button" variant="danger" onClick={discardAndLeave}>
            Discard and leave
          </Button>
        </div>
      </dialog>

      <div className="flex items-start gap-3 rounded-xl border border-line bg-surface-2/60 px-4 py-3 text-[12.5px] leading-5 text-muted">
        <MapPin size={15} className="mt-0.5 shrink-0 text-faint" aria-hidden="true" />
        <p>
          Projects are created inside your company workspace. Nothing is shared outside it. Archived
          projects keep every ticket and photo, and can be restored at any time.
        </p>
      </div>
    </form>
  );
}
