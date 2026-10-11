'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  FileImage,
  ImagePlus,
  Maximize2,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { addEvidenceAction, deleteEvidenceAction } from '@/lib/actions/evidence';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Card, CardHeader } from '@/components/ui/card';
import { Field, Textarea } from '@/components/ui/field';
import { cn, formatDate, pluralize } from '@/lib/utils';

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export type EvidenceView = {
  id: string;
  original_filename: string;
  mime_type: string;
  size_bytes: number;
  caption: string | null;
  notes: string | null;
  created_at: string;
  signedUrl: string | null;
  canDelete: boolean;
};

function niceBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024))} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export function EvidencePanel({
  companyId,
  projectId,
  projectName,
  ticketId,
  ticketNumber,
  evidence,
  hideTitle = false,
}: {
  companyId: string;
  projectId: string;
  projectName: string;
  ticketId?: string | null;
  ticketNumber?: string | null;
  evidence: EvidenceView[];
  hideTitle?: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [notes, setNotes] = useState('');
  const [stage, setStage] = useState<'idle' | 'uploading' | 'saving'>('idle');
  const [dragging, setDragging] = useState(false);
  const [busyDelete, setBusyDelete] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userId, setUserId] = useState('');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    void createClient()
      .auth.getUser()
      .then(({ data }) => {
        if (active && data.user?.id) setUserId(data.user.id);
      })
      .catch(() => {
        if (active) setUserId('');
      });
    return () => {
      active = false;
    };
  }, []);

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : ''), [file]);
  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const canUpload = Boolean(projectId) && Boolean(userId);
  const pending = stage !== 'idle';

  const selectFile = useCallback((candidate?: File | null) => {
    setError('');
    setSuccess('');
    if (!candidate) {
      setFile(null);
      return;
    }
    if (!MIME_TYPES.includes(candidate.type)) {
      setFile(null);
      setError('That file type is not supported. Use a JPG, PNG or WebP photo.');
      return;
    }
    if (candidate.size > MAX_FILE_BYTES) {
      setFile(null);
      setError(
        `That photo is ${niceBytes(candidate.size)}. Evidence photos must be 10 MB or smaller — most phone cameras can be set to a smaller size.`
      );
      return;
    }
    setFile(candidate);
  }, []);

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!file) {
      setError('Choose or capture a photo first.');
      return;
    }
    if (!canUpload) {
      setError('Your session could not be verified. Refresh the page and try again.');
      return;
    }

    const bucket = createClient().storage.from('evidence');
    const extension = file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/png' ? 'png' : 'webp';
    const path = `${companyId}/${projectId}/${ticketId || 'project'}/${userId}-${crypto.randomUUID()}.${extension}`;
    let stored = false;

    setStage('uploading');
    try {
      const { error: uploadError } = await bucket.upload(path, file, {
        cacheControl: '3600',
        contentType: file.type,
        upsert: false,
      });
      if (uploadError) throw new Error('The photo could not be uploaded. Check your connection and try again.');
      stored = true;

      setStage('saving');
      const result = await addEvidenceAction({
        projectId,
        ticketId: ticketId || null,
        storagePath: path,
        originalFilename: file.name.slice(0, 255),
        mimeType: file.type,
        sizeBytes: file.size,
        caption,
        notes,
      });
      if (result.error) throw new Error(result.error);

      setFile(null);
      setCaption('');
      setNotes('');
      if (inputRef.current) inputRef.current.value = '';
      setSuccess('Photo attached to this record.');
      router.refresh();
    } catch (uploadFailure) {
      // Never leave an orphaned object behind if the record could not be saved.
      if (stored) await bucket.remove([path]).catch(() => {});
      setError(
        uploadFailure instanceof Error
          ? uploadFailure.message
          : 'The photo could not be saved. Please try again.'
      );
    } finally {
      setStage('idle');
    }
  }

  async function removeEvidence(item: EvidenceView) {
    setBusyDelete(item.id);
    setError('');
    setSuccess('');
    const result = await deleteEvidenceAction(item.id);
    setBusyDelete('');
    if (result.error) {
      setError(result.error);
      return result;
    }
    setSuccess('Photo removed.');
    setActiveIndex(null);
    router.refresh();
    return {};
  }

  const library = evidence.filter((item) => Boolean(item.signedUrl));
  const activePhoto = activeIndex === null ? null : evidence[activeIndex] ?? null;

  const step = useCallback(
    (delta: number) => {
      if (activeIndex === null) return;
      const next = (activeIndex + delta + evidence.length) % evidence.length;
      setActiveIndex(next);
    },
    [activeIndex, evidence.length]
  );

  return (
    <Card flush>
      {!hideTitle && (
        <CardHeader
          title="Photo evidence &amp; field notes"
          description={`${ticketNumber ? `Ticket ${ticketNumber} · ` : ''}${projectName}`}
          icon={<Camera size={16} aria-hidden="true" />}
          bordered
          action={
            <span className="text-[12px] text-muted">{pluralize(evidence.length, 'photo')}</span>
          }
        />
      )}

      <div className="no-print p-5 sm:p-6">
        <form onSubmit={upload} method="post">
          <div
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              selectFile(event.dataTransfer.files?.[0] ?? null);
            }}
            className={cn(
              'rounded-xl border border-dashed p-4 transition-colors duration-150',
              dragging ? 'border-brand-500 bg-brand-50/60' : 'border-line-strong bg-surface-2/50'
            )}
          >
            <div className="flex flex-col gap-4 sm:flex-row">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="group relative flex h-32 w-full shrink-0 items-center justify-center overflow-hidden rounded-lg border border-line bg-surface transition-colors duration-150 hover:border-brand-300 sm:h-36 sm:w-40"
                aria-label={file ? 'Choose a different photo' : 'Take or choose a photo'}
              >
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Selected photo preview"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex flex-col items-center px-3 text-center">
                    <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-50 text-brand-700 transition-transform duration-150 group-hover:scale-105">
                      <ImagePlus size={19} aria-hidden="true" />
                    </span>
                    <span className="mt-2 text-[12.5px] font-semibold text-ink">
                      Take or choose a photo
                    </span>
                    <span className="mt-0.5 text-[11px] text-subtle">JPG, PNG or WebP · 10 MB max</span>
                  </span>
                )}
                {file && (
                  <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 rounded-full bg-ink/85 px-2.5 py-1 text-[10.5px] font-semibold text-white">
                    Change photo
                  </span>
                )}
              </button>

              <input
                ref={inputRef}
                className="sr-only"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                capture="environment"
                onChange={(event) => selectFile(event.target.files?.[0] ?? null)}
                aria-label="Upload an evidence photo"
              />

              <div className="min-w-0 flex-1 space-y-3">
                {file ? (
                  <p className="flex items-center gap-2 rounded-lg border border-brand-line bg-brand-50/70 px-3 py-2 text-[12.5px] text-brand-900">
                    <FileImage size={14} className="shrink-0" aria-hidden="true" />
                    <span className="min-w-0 flex-1 truncate">{file.name}</span>
                    <span className="shrink-0 font-mono text-[11.5px]">{niceBytes(file.size)}</span>
                  </p>
                ) : (
                  <p className="text-[13px] leading-5 text-muted">
                    Capture the condition, the obstruction, or the finished work while it is still
                    visible. Photos stay private to your company and are shown through links that
                    expire after an hour.
                  </p>
                )}

                <Field id="evidence-caption" label="Caption" optional>
                  {(props) => (
                    <input
                      {...props}
                      className="field-control"
                      name="caption"
                      value={caption}
                      onChange={(event) => setCaption(event.target.value)}
                      maxLength={240}
                      placeholder="Feeder conflict above the ceiling grid"
                    />
                  )}
                </Field>

                <Field id="evidence-notes" label="Field note" optional>
                  {(props) => (
                    <Textarea
                      {...props}
                      name="notes"
                      className="field-control min-h-20"
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                      maxLength={3000}
                      placeholder="Direction received, access issues, or anything a reviewer should know."
                    />
                  )}
                </Field>

                <div className="flex flex-wrap items-center gap-3">
                  <Button type="submit" loading={pending} disabled={!file || !canUpload}>
                    {!pending && <UploadCloud size={15} aria-hidden="true" />}
                    {stage === 'uploading'
                      ? 'Uploading photo…'
                      : stage === 'saving'
                        ? 'Saving record…'
                        : 'Attach photo'}
                  </Button>
                  {file && !pending && (
                    <Button type="button" variant="ghost" onClick={() => selectFile(null)}>
                      Clear
                    </Button>
                  )}
                </div>

                {pending && (
                  <div
                    className="h-1.5 overflow-hidden rounded-full bg-surface-3"
                    role="progressbar"
                    aria-label={stage === 'uploading' ? 'Uploading photo' : 'Saving evidence record'}
                  >
                    <div className="h-full w-1/2 animate-pulse rounded-full bg-brand-600" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </form>

        {error && (
          <div className="mt-3">
            <Alert tone="danger" role="alert" title="Photo not saved">
              {error}
            </Alert>
          </div>
        )}
        {success && (
          <div className="mt-3">
            <Alert tone="success" role="status">
              {success}
            </Alert>
          </div>
        )}
      </div>

      {/* Gallery */}
      <div className="border-t border-line p-5 sm:p-6">
        {evidence.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line-strong bg-surface-2/50 px-5 py-10 text-center">
            <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl border border-line bg-surface text-subtle">
              <Camera size={20} aria-hidden="true" />
            </span>
            <p className="mt-3 text-[14px] font-semibold text-ink">No photos on this record yet</p>
            <p className="mx-auto mt-1 max-w-sm text-[13px] leading-6 text-muted">
              A photo taken now is worth more than a description written next week. Add the first one
              above.
            </p>
          </div>
        ) : (
          <>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {evidence.map((item, index) => (
                <li key={item.id}>
                  <figure className="group overflow-hidden rounded-xl border border-line bg-surface transition-colors duration-150 hover:border-line-strong">
                    <button
                      type="button"
                      onClick={() => setActiveIndex(index)}
                      className="relative block aspect-[4/3] w-full cursor-zoom-in overflow-hidden bg-surface-3"
                      aria-label={`Open ${item.caption || item.original_filename} in the viewer`}
                    >
                      {item.signedUrl ? (
                        <img
                          src={item.signedUrl}
                          alt={item.caption || item.original_filename}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <span className="grid h-full place-items-center px-3 text-center text-[11.5px] text-subtle">
                          Preview link expired — refresh the page
                        </span>
                      )}
                      <span className="absolute bottom-1.5 right-1.5 grid h-6 w-6 place-items-center rounded-md bg-ink/70 text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100">
                        <Maximize2 size={12} aria-hidden="true" />
                      </span>
                    </button>
                    <figcaption className="px-3 py-2.5">
                      <p className="truncate text-[12.5px] font-medium text-ink">
                        {item.caption || item.original_filename}
                      </p>
                      <p className="mt-0.5 text-[11px] text-subtle">
                        {formatDate(item.created_at)} · {niceBytes(item.size_bytes)}
                      </p>
                      {item.notes && (
                        <p className="mt-1.5 line-clamp-2 text-[11.5px] leading-5 text-muted">
                          {item.notes}
                        </p>
                      )}
                    </figcaption>
                  </figure>
                </li>
              ))}
            </ul>
            {library.length < evidence.length && (
              <p className="mt-3 text-[12px] text-muted">
                {evidence.length - library.length} preview link
                {evidence.length - library.length === 1 ? ' has' : 's have'} expired. Refresh the page
                to issue new private links.
              </p>
            )}
          </>
        )}
      </div>

      {/* Viewer */}
      {activePhoto && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-ink/92 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={`Photo viewer: ${activePhoto.caption || activePhoto.original_filename}`}
          onKeyDown={(event) => {
            if (event.key === 'Escape') setActiveIndex(null);
            if (event.key === 'ArrowRight') step(1);
            if (event.key === 'ArrowLeft') step(-1);
          }}
          tabIndex={-1}
        >
          <div className="flex items-start justify-between gap-4 p-4 text-white sm:p-6">
            <div className="min-w-0">
              <p className="truncate text-[14px] font-semibold">
                {activePhoto.caption || activePhoto.original_filename}
              </p>
              <p className="mt-0.5 text-[12px] text-slate-400">
                {formatDate(activePhoto.created_at, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}{' '}
                · {niceBytes(activePhoto.size_bytes)}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {activePhoto.signedUrl && (
                <a
                  href={activePhoto.signedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden min-h-9 items-center rounded-lg border border-white/20 px-3 text-[12.5px] font-medium text-white transition-colors duration-150 hover:bg-white/10 sm:inline-flex"
                >
                  Open original
                </a>
              )}
              <button
                type="button"
                onClick={() => setActiveIndex(null)}
                className="grid h-9 w-9 place-items-center rounded-lg text-slate-300 transition-colors duration-150 hover:bg-white/10 hover:text-white"
                aria-label="Close viewer"
              >
                <X size={19} aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="relative flex flex-1 items-center justify-center overflow-hidden px-4">
            {evidence.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => step(-1)}
                  className="absolute left-2 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white transition-colors duration-150 hover:bg-white/20 sm:left-6"
                  aria-label="Previous photo"
                >
                  <ChevronLeft size={20} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => step(1)}
                  className="absolute right-2 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white transition-colors duration-150 hover:bg-white/20 sm:right-6"
                  aria-label="Next photo"
                >
                  <ChevronRight size={20} aria-hidden="true" />
                </button>
              </>
            )}
            {activePhoto.signedUrl ? (
              <img
                src={activePhoto.signedUrl}
                alt={activePhoto.caption || activePhoto.original_filename}
                className="max-h-full max-w-full rounded-lg object-contain shadow-lg"
              />
            ) : (
              <p className="text-[13px] text-slate-300">
                This private link has expired. Close the viewer and refresh the page.
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-6">
            <p className="max-w-2xl text-[12.5px] leading-5 text-slate-300">
              {activePhoto.notes || 'No additional field notes for this photo.'}
            </p>
            {activePhoto.canDelete ? (
              <ConfirmDialog
                triggerLabel="Delete photo"
                triggerVariant="ghost"
                triggerSize="sm"
                triggerIcon={<Trash2 size={13} aria-hidden="true" />}
                title="Delete this photo?"
                description="The image is permanently removed from private storage and from this record. This cannot be undone."
                confirmLabel="Delete photo"
                pendingLabel="Deleting…"
                onConfirm={() => removeEvidence(activePhoto)}
              />
            ) : (
              <span className="text-[12px] text-slate-500">Only the uploader can remove a photo</span>
            )}
          </div>
        </div>
      )}

      {busyDelete && !activePhoto && (
        <p role="status" className="px-5 pb-4 text-[12px] text-muted">
          Removing photo…
        </p>
      )}
    </Card>
  );
}
