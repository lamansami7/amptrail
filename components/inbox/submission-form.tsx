'use client';

import { useId, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { PhotoPicker } from '@/components/inbox/photo-picker';
import { createSubmissionAction } from '@/lib/actions/inbox';
import { uploadSubmissionPhotos } from '@/lib/inbox/upload';

const MAX_BODY = 5000;

/**
 * Log a field note. This is the web path into the inbox: a person types what the
 * crew reported. Nothing is guessed, and the original wording is kept as typed.
 */
export function SubmissionForm({
  companyId,
  projects,
  defaultSender,
}: {
  companyId: string;
  projects: Array<{ id: string; name: string; project_number: string | null }>;
  defaultSender: string;
}) {
  const uid = useId();
  const router = useRouter();
  const [sender, setSender] = useState(defaultSender);
  const [projectId, setProjectId] = useState('');
  const [body, setBody] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [photoProblems, setPhotoProblems] = useState<string[]>([]);
  const [stage, setStage] = useState<'idle' | 'saving' | 'uploading'>('idle');
  const [partial, setPartial] = useState<{ id: string; failures: string[] } | null>(null);

  const busy = stage !== 'idle';

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return; // prevents double submission
    setError(null);
    setPartial(null);

    if (!body.trim()) {
      setError('Write what happened. The note cannot be empty.');
      return;
    }

    setStage('saving');
    const created = await createSubmissionAction({ senderName: sender, body, projectId });
    if (created.error !== undefined) {
      setError(created.error);
      setStage('idle');
      return;
    }

    if (files.length) {
      setStage('uploading');
      const outcome = await uploadSubmissionPhotos({ companyId, submissionId: created.id, files });
      if (outcome.failures.length) {
        // The note itself is safe. Say so, and let the person open it and retry the photos.
        setPartial({ id: created.id, failures: outcome.failures });
        setStage('idle');
        return;
      }
    }
    router.push(`/inbox/${created.id}`);
  }

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      {error && (
        <Alert tone="danger" role="alert" title="The note was not saved">
          {error}
        </Alert>
      )}
      {partial && (
        <Alert tone="warning" role="alert" title="Note saved, but some photos did not upload">
          <ul className="list-disc space-y-0.5 pl-4">
            {partial.failures.map((failure) => (
              <li key={failure}>{failure}</li>
            ))}
          </ul>
          <p className="mt-2">
            <Link href={`/inbox/${partial.id}`} className="link font-semibold">
              Open the note to add the missing photos
            </Link>
            .
          </p>
        </Alert>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id={`${uid}-sender`} label="Who reported it" optional hint="For example the foreman's name.">
          {(props) => (
            <Input
              {...props}
              value={sender}
              maxLength={120}
              disabled={busy}
              onChange={(event) => setSender(event.target.value)}
            />
          )}
        </Field>
        <Field
          id={`${uid}-project`}
          label="Project"
          optional
          hint="Leave blank if you are not sure. The note will wait in the inbox as “Needs project”."
        >
          {(props) => (
            <Select {...props} value={projectId} disabled={busy} onChange={(event) => setProjectId(event.target.value)}>
              <option value="">Not sure yet</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.project_number ? `${project.project_number} · ${project.name}` : project.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </div>

      <Field
        id={`${uid}-body`}
        label="What happened"
        required
        hint="Paste or type the message as it was sent. Names, hours, materials and quantities all go in the note; do not guess anything you were not told."
      >
        {(props) => (
          <>
            <Textarea
              {...props}
              rows={7}
              maxLength={MAX_BODY}
              value={body}
              disabled={busy}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Extra conduit run on Level 2. Mike and James worked 4 hours each. Used 120 feet of 3/4-inch EMT…"
            />
            <p className="mt-1 text-right text-[11.5px] text-muted" aria-hidden="true">
              {body.length.toLocaleString()} / {MAX_BODY.toLocaleString()}
            </p>
          </>
        )}
      </Field>

      <div>
        <p className="label mb-1.5">
          Photos <span className="font-normal text-muted">(optional)</span>
        </p>
        <PhotoPicker files={files} onChange={setFiles} onProblems={setPhotoProblems} disabled={busy} />
        {photoProblems.length > 0 && (
          <ul className="mt-2 space-y-0.5 text-[12.5px] font-medium text-danger" role="alert">
            {photoProblems.map((problem) => (
              <li key={problem}>{problem}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-5">
        <Button type="submit" loading={busy} disabled={busy}>
          {stage === 'uploading' ? 'Uploading photos…' : stage === 'saving' ? 'Saving…' : 'Add to inbox'}
        </Button>
        <Link href="/inbox" className="link text-[13px]">
          Cancel
        </Link>
        <p className="text-[12px] text-muted">The original wording is kept exactly as typed and cannot be edited later.</p>
      </div>
    </form>
  );
}
