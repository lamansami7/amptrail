'use client';

import { useId, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, Select, Textarea } from '@/components/ui/field';
import { triageSubmissionAction } from '@/lib/actions/inbox';
import { manualSubmissionStatuses, resolveTriage, submissionStatusOptions, type SubmissionStatus } from '@/lib/inbox/status';

/**
 * Office triage: assign a project, flag what is missing, or set the note aside.
 * The same rules the database enforces are applied here first so refusals are
 * explained instead of surprising.
 */
export function TriagePanel({
  submissionId,
  status,
  projectId,
  missingDetails,
  projects,
}: {
  submissionId: string;
  status: SubmissionStatus;
  projectId: string | null;
  missingDetails: string | null;
  projects: Array<{ id: string; name: string; project_number: string | null }>;
}) {
  const uid = useId();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [project, setProject] = useState(projectId ?? '');
  const [nextStatus, setNextStatus] = useState<SubmissionStatus>(status);
  const [note, setNote] = useState(missingDetails ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const dirty =
    project !== (projectId ?? '') || nextStatus !== status || (nextStatus === 'missing_details' && note.trim() !== (missingDetails ?? ''));
  const preview = resolveTriage(status, { status: nextStatus, projectId: project || null, missingDetails: note });

  function save() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await triageSubmissionAction({
        id: submissionId,
        projectId: project,
        status: nextStatus,
        missingDetails: note,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  const choices = submissionStatusOptions.filter((option) => manualSubmissionStatuses.includes(option.value));

  return (
    <div className="space-y-4">
      <Field id={`${uid}-project`} label="Project">
        {(props) => (
          <Select
            {...props}
            value={project}
            disabled={pending}
            onChange={(event) => {
              setProject(event.target.value);
              setSaved(false);
            }}
          >
            <option value="">No project yet</option>
            {projects.map((item) => (
              <option key={item.id} value={item.id}>
                {item.project_number ? `${item.project_number} · ${item.name}` : item.name}
              </option>
            ))}
          </Select>
        )}
      </Field>

      <Field
        id={`${uid}-status`}
        label="Status"
        hint={choices.find((option) => option.value === nextStatus)?.description}
      >
        {(props) => (
          <Select
            {...props}
            value={nextStatus}
            disabled={pending}
            onChange={(event) => {
              setNextStatus(event.target.value as SubmissionStatus);
              setSaved(false);
            }}
          >
            {choices.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        )}
      </Field>

      {nextStatus === 'missing_details' && (
        <Field
          id={`${uid}-missing`}
          label="What is missing"
          required
          hint="One specific question is better than a vague request, for example “Which project was this for?”"
        >
          {(props) => (
            <Textarea
              {...props}
              rows={3}
              maxLength={1000}
              value={note}
              disabled={pending}
              onChange={(event) => {
                setNote(event.target.value);
                setSaved(false);
              }}
            />
          )}
        </Field>
      )}

      {!preview.ok && dirty && (
        <p className="text-[12.5px] font-medium text-warning" role="status">
          {preview.error}
        </p>
      )}
      {error && (
        <Alert tone="danger" role="alert">
          {error}
        </Alert>
      )}

      <div className="flex items-center gap-3">
        <Button size="sm" onClick={save} loading={pending} disabled={!dirty || pending || !preview.ok}>
          Save changes
        </Button>
        {saved && !dirty && (
          <span className="flex items-center gap-1 text-[12px] font-medium text-success" role="status">
            <Check size={13} aria-hidden="true" /> Saved
          </span>
        )}
      </div>
    </div>
  );
}
