'use client';

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, FileImage, LoaderCircle, Trash2, UploadCloud } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { addEvidenceAction, deleteEvidenceAction } from '@/lib/actions/evidence';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export type EvidenceView = { id: string; original_filename: string; mime_type: string; size_bytes: number; caption: string | null; notes: string | null; created_at: string; signedUrl: string | null; canDelete: boolean };

function niceBytes(value: number) {
  return value < 1024 * 1024 ? `${Math.max(1, Math.round(value / 1024))} KB` : `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export function EvidencePanel({ companyId, projectId, projectName, ticketId, ticketNumber, evidence, hideTitle = false }: { companyId: string; projectId: string; projectName: string; ticketId?: string | null; ticketNumber?: string | null; evidence: EvidenceView[]; hideTitle?: boolean }) {
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

  useEffect(() => {
    let active = true;
    void createClient().auth.getUser().then(({ data }) => {
      if (active && data.user?.id) setUserPrefix(data.user.id);
    }).catch(() => {
      if (active) setUserPrefix('');
    });
    return () => { active = false; };
  }, []);

  const previewUrl = useMemo(() => file ? URL.createObjectURL(file) : '', [file]);
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  function selectFile(candidate?: File) {
    setError('');
    setSuccess('');
    if (!candidate) { setFile(null); return; }
    if (!MIME_TYPES.includes(candidate.type)) {
      setFile(null);
      setError('Choose a JPG, PNG, or WebP image.');
      return;
    }
    if (candidate.size > MAX_FILE_BYTES) {
      setFile(null);
      setError('Images must be 10 MB or smaller.');
      return;
    }
    setFile(candidate);
  }

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (!file) { setError('Choose a photo before uploading.'); return; }
    if (!userPrefix) { setError('Your session could not be verified. Refresh the page and try again.'); return; }
    setPending(true);
    const bucket = createClient().storage.from('evidence');
    const extension = file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/png' ? 'png' : 'webp';
    const path = `${companyId}/${projectId}/${ticketId || 'project'}/${userPrefix}-${crypto.randomUUID()}.${extension}`;
    let stored = false;
    try {
      setProgress('Uploading photo securely…');
      const { error: uploadError } = await bucket.upload(path, file, { cacheControl: '3600', contentType: file.type, upsert: false });
      if (uploadError) throw new Error('The photo could not be uploaded. Check your connection and workspace storage setup.');
      stored = true;
      setProgress('Saving the evidence record…');
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
      setSuccess('Photo added to this private work record.');
      router.refresh();
    } catch (uploadError) {
      if (stored) {
        const { error: removeError } = await bucket.remove([path]);
        if (removeError) console.error('Could not remove an unlinked evidence object.');
      }
      setError(uploadError instanceof Error ? uploadError.message : 'The photo could not be saved. Please try again.');
    } finally {
      setPending(false);
      setProgress('');
    }
  }

  async function removeEvidence(item: EvidenceView) {
    if (!window.confirm('Remove this photo and its evidence record? This cannot be undone.')) return;
    setBusyDelete(item.id);
    setError('');
    setSuccess('');
    const result = await deleteEvidenceAction(item.id);
    setBusyDelete('');
    if (result.error) setError(result.error);
    else { setSuccess('Evidence removed.'); router.refresh(); }
  }

  return <section className="rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6">
    {!hideTitle && <div className="mb-5"><p className="eyebrow">Evidence</p><h2 className="mt-1 text-lg font-bold text-ink">Photos and supporting notes</h2><p className="mt-1 text-sm text-muted">{ticketNumber ? `${ticketNumber} · ` : ''}{projectName}</p></div>}
    <form onSubmit={upload} className="no-print rounded-2xl border border-dashed border-slate-300 bg-canvas p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <button type="button" onClick={() => inputRef.current?.click()} className="group relative flex min-h-[150px] w-full flex-col items-center justify-center overflow-hidden rounded-xl border border-line bg-white text-center transition hover:border-orange sm:w-48">
          {previewUrl ? <><img src={previewUrl} alt="Selected photo preview" className="absolute inset-0 h-full w-full object-cover" /><span className="absolute bottom-2 rounded-full bg-navy/85 px-2.5 py-1 text-[10px] font-bold text-white">Change photo</span></> : <><Camera size={24} className="text-orange" /><span className="mt-2 text-xs font-bold text-ink">Take or choose a photo</span><span className="mt-1 text-[10px] text-muted">JPG, PNG, or WebP · 10 MB max</span></>}
        </button>
        <input ref={inputRef} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={(event) => selectFile(event.target.files?.[0])} aria-label="Choose evidence photo" />
        <div className="min-w-0 flex-1 space-y-3">
          {file ? <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-ink"><FileImage size={15} className="shrink-0 text-orange" /><span className="min-w-0 flex-1 truncate">{file.name}</span><span className="shrink-0 text-muted">{niceBytes(file.size)}</span></div> : <p className="text-xs leading-5 text-muted">Add a caption or field note to keep context with the photo. Images are stored in a private workspace bucket.</p>}
          <div><label className="field-label text-xs" htmlFor="evidence-caption">Caption</label><input className="field-control min-h-10 px-3 py-2 text-sm" id="evidence-caption" value={caption} onChange={(event) => setCaption(event.target.value)} maxLength={240} placeholder="For example: conduit route before cover-up" /></div>
          <div><label className="field-label text-xs" htmlFor="evidence-notes">Notes <span className="font-normal text-muted">(optional)</span></label><textarea className="field-control min-h-20 resize-y px-3 py-2 text-sm" id="evidence-notes" value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={3000} placeholder="What should someone know about this photo?" /></div>
          <Button type="submit" disabled={pending || !file || !userPrefix} className="w-full sm:w-auto">{pending ? <LoaderCircle size={16} className="animate-spin" /> : <UploadCloud size={16} />}{pending ? progress || 'Uploading…' : 'Upload evidence'}</Button>
          {pending && <div className="h-1.5 overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-label="Photo upload in progress"><div className="h-full w-2/3 animate-pulse rounded-full bg-orange" /></div>}
        </div>
      </div>
    </form>

    {error && <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-800" role="alert">{error}</p>}
    {success && <p className="mt-3 rounded-xl border border-green-200 bg-green-50 px-3.5 py-3 text-sm text-green-900" role="status">{success}</p>}

    <div className="mt-5">
      {evidence.length === 0 ? <div className="rounded-xl border border-dashed border-line px-4 py-6 text-center"><Camera size={20} className="mx-auto text-slate-400" /><p className="mt-2 text-sm font-semibold text-ink">No evidence added yet</p><p className="mt-1 text-xs text-muted">A clear photo can help keep the job record complete.</p></div> : <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {evidence.map((item) => <article key={item.id} className="overflow-hidden rounded-xl border border-line bg-white">
          <div className="relative aspect-[4/3] bg-canvas">{item.signedUrl ? <img src={item.signedUrl} alt={item.caption || item.original_filename} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-xs text-muted">Preview unavailable — refresh to request a new private link</div>}</div>
          <div className="p-3.5"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="truncate text-sm font-bold text-ink">{item.caption || item.original_filename}</p><p className="mt-1 text-[11px] text-muted">{formatDate(item.created_at)} · {niceBytes(item.size_bytes)}</p></div>{item.canDelete && <button type="button" onClick={() => removeEvidence(item)} disabled={busyDelete === item.id} aria-label={`Remove ${item.original_filename}`} className="no-print grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted hover:bg-red-50 hover:text-red-600 disabled:opacity-50">{busyDelete === item.id ? <LoaderCircle size={15} className="animate-spin" /> : <Trash2 size={15} />}</button>}</div>{item.notes && <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-xs leading-5 text-slate-600">{item.notes}</p>}</div>
        </article>)}
      </div>}
    </div>
  </section>;
}
