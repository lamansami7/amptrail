'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { PhotoPicker } from '@/components/inbox/photo-picker';
import { uploadSubmissionPhotos } from '@/lib/inbox/upload';

/** Add photos to an existing note. Photos cannot be removed once attached. */
export function AddPhotos({
  companyId,
  submissionId,
  attached,
}: {
  companyId: string;
  submissionId: string;
  attached: number;
}) {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [problems, setProblems] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [failures, setFailures] = useState<string[]>([]);

  async function upload() {
    if (busy || !files.length) return;
    setBusy(true);
    setFailures([]);
    const outcome = await uploadSubmissionPhotos({ companyId, submissionId, files });
    setBusy(false);
    setFailures(outcome.failures);
    // Keep only the files that failed so a retry does not duplicate the successful ones.
    setFiles(files.filter((file) => outcome.failures.some((failure) => failure.startsWith(`${file.name}:`))));
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <PhotoPicker files={files} onChange={setFiles} onProblems={setProblems} alreadyAttached={attached} disabled={busy} />
      {problems.length > 0 && (
        <ul className="space-y-0.5 text-[12.5px] font-medium text-danger" role="alert">
          {problems.map((problem) => (
            <li key={problem}>{problem}</li>
          ))}
        </ul>
      )}
      {failures.length > 0 && (
        <Alert tone="danger" role="alert" title="Some photos did not upload">
          <ul className="list-disc pl-4">
            {failures.map((failure) => (
              <li key={failure}>{failure}</li>
            ))}
          </ul>
        </Alert>
      )}
      {files.length > 0 && (
        <Button size="sm" onClick={upload} loading={busy} disabled={busy}>
          {busy ? 'Uploading…' : `Upload ${files.length} photo${files.length === 1 ? '' : 's'}`}
        </Button>
      )}
    </div>
  );
}
