'use client';

import { useId, useRef } from 'react';
import { Camera, X } from 'lucide-react';
import { checkPhotoSelection, niceBytes, PHOTO_TYPES } from '@/lib/inbox/upload';
import { MAX_SUBMISSION_PHOTOS } from '@/lib/inbox/status';

/** Controlled multi-photo picker shared by the note form and the add-photos card. */
export function PhotoPicker({
  files,
  onChange,
  onProblems,
  alreadyAttached = 0,
  disabled,
}: {
  files: File[];
  onChange: (files: File[]) => void;
  onProblems: (problems: string[]) => void;
  alreadyAttached?: number;
  disabled?: boolean;
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const remaining = MAX_SUBMISSION_PHOTOS - alreadyAttached - files.length;

  return (
    <div>
      <label
        htmlFor={id}
        className={`flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-line-strong bg-surface-2/60 px-4 py-3 text-[13px] font-semibold text-body transition-colors hover:bg-surface-3 focus-within:ring-2 focus-within:ring-brand-500 ${
          disabled || remaining <= 0 ? 'pointer-events-none opacity-50' : ''
        }`}
      >
        <Camera size={16} aria-hidden="true" />
        {files.length ? 'Add more photos' : 'Add photos'}
        <span className="font-normal text-muted">
          (JPG, PNG or WebP, up to 10 MB each, {Math.max(0, remaining)} more allowed)
        </span>
      </label>
      <input
        id={id}
        ref={input}
        type="file"
        multiple
        accept={PHOTO_TYPES.join(',')}
        className="sr-only"
        disabled={disabled || remaining <= 0}
        onChange={(event) => {
          const incoming = Array.from(event.target.files ?? []);
          const { accepted, problems } = checkPhotoSelection(files, incoming, alreadyAttached);
          onProblems(problems);
          if (accepted.length) onChange([...files, ...accepted]);
          // Let the same file be chosen again after removing it.
          if (input.current) input.current.value = '';
        }}
      />

      {files.length > 0 && (
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${file.lastModified}-${index}`}
              className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-[12.5px]"
            >
              <span className="min-w-0 flex-1 truncate text-ink-soft">{file.name}</span>
              <span className="shrink-0 text-muted">{niceBytes(file.size)}</span>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onChange(files.filter((_, position) => position !== index))}
                className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-muted transition-colors hover:bg-surface-3 hover:text-ink"
                aria-label={`Remove ${file.name}`}
              >
                <X size={14} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
