'use client';

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  Camera,
  FileImage,
  LoaderCircle,
  Trash2,
  UploadCloud,
  Maximize2,
  X,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { addEvidenceAction, deleteEvidenceAction } from '@/lib/actions/evidence';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';

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
  return value < 1024 * 1024
    ? `${Math.max(1, Math.round(value / 1024))} KB`
    : `${(value / (1024 * 1024)).toFixed(1)} MB`;
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
  const [pending, setPending] = useState(false);
  const [busyDelete, setBusyDelete] = useState('');
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userPrefix, setUserPrefix] = useState('');

  // Lightbox Modal state
  const [activePhoto, setActivePhoto] = useState<EvidenceView | null>(null);

  useEffect(() => {
    let active = true;
    void createClient()
      .auth.getUser()
      .then(({ data }) => {
        if (active && data.user?.id) setUserPrefix(data.user.id);
      })
      .catch(() => {
        if (active) setUserPrefix('');
      });
    return () => {
      active = false;
    };
  }, []);

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : ''), [file]);
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function selectFile(candidate?: File) {
    setError('');
    setSuccess('');
    if (!candidate) {
      setFile(null);
      return;
    }
    if (!MIME_TYPES.includes(candidate.type)) {
      setFile(null);
      setError('Unsupported format. Please select a JPG, PNG, or WebP photo.');
      return;
    }
    if (candidate.size > MAX_FILE_BYTES) {
      setFile(null);
      setError('File size too large. Evidence photos must be 10 MB or smaller.');
      return;
    }
    setFile(candidate);
  }

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (!file) {
      setError('Please select or capture a photo first.');
      return;
    }
    if (!userPrefix) {
      setError('Your session could not be verified. Please refresh the page.');
      return;
    }
    setPending(true);
    const bucket = createClient().storage.from('evidence');
    const extension = file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/png' ? 'png' : 'webp';
    const path = `${companyId}/${projectId}/${ticketId || 'project'}/${userPrefix}-${crypto.randomUUID()}.${extension}`;
    let stored = false;

    try {
      setProgress('Uploading photo to private workspace storage…');
      const { error: uploadError } = await bucket.upload(path, file, {
        cacheControl: '3600',
        contentType: file.type,
        upsert: false,
      });
      if (uploadError) {
        throw new Error('Photo upload failed. Check your network connection.');
      }
      stored = true;

      setProgress('Saving evidence record…');
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
      setSuccess('Photo evidence securely added to this record.');
      router.refresh();
    } catch (uploadError) {
      if (stored) {
        await bucket.remove([path]).catch(() => {});
      }
      setError(
        uploadError instanceof Error ? uploadError.message : 'Photo could not be saved. Please retry.'
      );
    } finally {
      setPending(false);
      setProgress('');
    }
  }

  async function removeEvidence(item: EvidenceView) {
    if (!window.confirm('Remove this evidence photo from the workspace? This action is permanent.'))
      return;
    setBusyDelete(item.id);
    setError('');
    setSuccess('');
    const result = await deleteEvidenceAction(item.id);
    setBusyDelete('');
    if (result.error) {
      setError(result.error);
    } else {
      setSuccess('Evidence photo deleted.');
      if (activePhoto?.id === item.id) setActivePhoto(null);
      router.refresh();
    }
  }

  return (
    <section className="card p-6 sm:p-7">
      {!hideTitle && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <p className="eyebrow">Jobsite Verification</p>
            <h2 className="mt-1 text-lg font-bold text-slate-900">Photo Evidence & Field Notes</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {ticketNumber ? `Attached to Ticket ${ticketNumber} · ` : ''}
              {projectName}
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {evidence.length} photo{evidence.length === 1 ? '' : 's'} recorded
          </span>
        </div>
      )}

      {/* Upload Zone */}
      <form onSubmit={upload} className="no-print rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-4 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          {/* Photo Trigger / Preview Box */}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="group relative flex min-h-[170px] w-full flex-col items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white p-3 text-center transition hover:border-blue-500 sm:w-52"
          >
            {previewUrl ? (
              <>
                <img
                  src={previewUrl}
                  alt="Selected upload preview"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <span className="absolute bottom-2 rounded-full bg-slate-900/80 px-2.5 py-1 text-[10px] font-bold text-white shadow-xs">
                  Change Photo
                </span>
              </>
            ) : (
              <>
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-blue-50 text-blue-600 group-hover:scale-110 transition">
                  <Camera size={24} />
                </div>
                <span className="mt-3 text-xs font-bold text-slate-800">
                  Tap to Take / Select Photo
                </span>
                <span className="mt-1 text-[10px] text-slate-400">
                  Camera or File · 10 MB Max
                </span>
              </>
            )}
          </button>

          <input
            ref={inputRef}
            className="sr-only"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            onChange={(e) => selectFile(e.target.files?.[0])}
            aria-label="Upload evidence image"
          />

          <div className="min-w-0 flex-1 space-y-3.5">
            {file ? (
              <div className="flex items-center gap-2 rounded-lg bg-blue-50/80 border border-blue-200/60 px-3 py-2 text-xs font-semibold text-blue-900">
                <FileImage size={15} className="shrink-0 text-blue-600" />
                <span className="min-w-0 flex-1 truncate">{file.name}</span>
                <span className="shrink-0 text-blue-700 font-mono">{niceBytes(file.size)}</span>
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                Capture work conditions, equipment obstructions, or completed installations. Stored in encrypted, private workspace storage.
              </p>
            )}

            <div>
              <label className="field-label text-[11px]" htmlFor="evidence-caption">
                Photo Caption / Subject
              </label>
              <input
                className="field-control min-h-9 px-3 py-1.5 text-xs sm:text-sm"
                id="evidence-caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                maxLength={240}
                placeholder="e.g. Existing junction box conflict prior to relocation"
              />
            </div>

            <div>
              <label className="field-label text-[11px]" htmlFor="evidence-notes">
                Field Observation Notes <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <textarea
                className="field-control min-h-20 resize-y px-3 py-1.5 text-xs sm:text-sm"
                id="evidence-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={3000}
                placeholder="Note any specific direction given by GC or hazardous conditions observed..."
              />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button
                type="submit"
                disabled={pending || !file || !userPrefix}
                className="min-w-36"
              >
                {pending ? (
                  <LoaderCircle size={15} className="animate-spin" />
                ) : (
                  <UploadCloud size={15} />
                )}
                {pending ? progress || 'Uploading…' : 'Save Photo Evidence'}
              </Button>
            </div>

            {pending && (
              <div
                className="h-1.5 overflow-hidden rounded-full bg-slate-200"
                role="progressbar"
                aria-label="Upload in progress"
              >
                <div className="h-full w-2/3 animate-pulse rounded-full bg-blue-600" />
              </div>
            )}
          </div>
        </div>
      </form>

      {/* Alerts */}
      {error && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-800" role="alert">
          <AlertCircle size={15} className="shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800" role="status">
          <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {/* Photos Grid */}
      <div className="mt-6">
        {evidence.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
            <Camera size={22} className="mx-auto text-slate-400" />
            <p className="mt-2 text-xs font-bold text-slate-700">No photos attached yet</p>
            <p className="mt-1 text-[11px] text-slate-400">
              Clear jobsite photos provide irrefutable proof when submitting extra work documentation.
            </p>
          </div>
        ) : (
          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {evidence.map((item) => (
              <div
                key={item.id}
                className="group flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-2xs transition hover:border-slate-300 hover:shadow-xs"
              >
                {/* Image clickable for lightbox */}
                <button
                  type="button"
                  onClick={() => setActivePhoto(item)}
                  className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 text-left cursor-zoom-in"
                  aria-label={`View full photo: ${item.caption || item.original_filename}`}
                >
                  {item.signedUrl ? (
                    <img
                      src={item.signedUrl}
                      alt={item.caption || item.original_filename}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-xs text-slate-400">
                      Private link expired — refresh page
                    </div>
                  )}
                  <span className="absolute bottom-2 right-2 rounded-lg bg-slate-900/70 p-1.5 text-white opacity-0 backdrop-blur-xs transition group-hover:opacity-100">
                    <Maximize2 size={14} />
                  </span>
                </button>

                <div className="p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-slate-900">
                        {item.caption || item.original_filename}
                      </p>
                      <p className="mt-0.5 text-[10px] text-slate-400">
                        {formatDate(item.created_at)} · {niceBytes(item.size_bytes)}
                      </p>
                    </div>

                    {item.canDelete && (
                      <button
                        type="button"
                        onClick={() => removeEvidence(item)}
                        disabled={busyDelete === item.id}
                        aria-label={`Delete ${item.original_filename}`}
                        className="grid h-7 w-7 place-items-center rounded-md text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                      >
                        {busyDelete === item.id ? (
                          <LoaderCircle size={14} className="animate-spin" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </button>
                    )}
                  </div>

                  {item.notes && (
                    <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-slate-600">
                      {item.notes}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {activePhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
          onClick={() => setActivePhoto(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
              <div className="min-w-0 pr-4">
                <h3 className="truncate text-sm font-bold text-slate-900">
                  {activePhoto.caption || activePhoto.original_filename}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {formatDate(activePhoto.created_at)} · {niceBytes(activePhoto.size_bytes)} · {activePhoto.mime_type}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActivePhoto(null)}
                className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close photo view"
              >
                <X size={18} />
              </button>
            </div>

            {/* Image Preview Container */}
            <div className="flex flex-1 items-center justify-center overflow-auto bg-slate-900 p-4">
              {activePhoto.signedUrl ? (
                <img
                  src={activePhoto.signedUrl}
                  alt={activePhoto.caption || activePhoto.original_filename}
                  className="max-h-[60vh] max-w-full rounded-lg object-contain shadow-lg"
                />
              ) : (
                <p className="text-xs text-white/70">Image preview unavailable.</p>
              )}
            </div>

            {/* Modal Footer with Notes */}
            <div className="flex flex-col gap-2 border-t border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                {activePhoto.notes ? (
                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {activePhoto.notes}
                  </p>
                ) : (
                  <p className="text-xs italic text-slate-400">No additional field notes for this photo.</p>
                )}
              </div>

              {activePhoto.signedUrl && (
                <a
                  href={activePhoto.signedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  <ExternalLink size={13} />
                  <span>Open Full Size</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
