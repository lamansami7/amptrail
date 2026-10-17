import { createClient } from '@/lib/supabase/client';
import { addSubmissionAttachmentAction } from '@/lib/actions/inbox';
import { MAX_SUBMISSION_PHOTOS } from '@/lib/inbox/status';

export const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

export function niceBytes(bytes: number) {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/** Returns a plain-language reason a photo cannot be used, or null when it is fine. */
export function validatePhoto(file: File): string | null {
  if (!PHOTO_TYPES.includes(file.type)) return `${file.name}: use a JPG, PNG or WebP photo.`;
  if (file.size > MAX_PHOTO_BYTES) {
    return `${file.name} is ${niceBytes(file.size)}. Photos must be 10 MB or smaller.`;
  }
  return null;
}

export function checkPhotoSelection(existing: File[], incoming: File[], alreadyAttached = 0) {
  const accepted: File[] = [];
  const problems: string[] = [];
  for (const file of incoming) {
    const problem = validatePhoto(file);
    if (problem) {
      problems.push(problem);
      continue;
    }
    if (alreadyAttached + existing.length + accepted.length >= MAX_SUBMISSION_PHOTOS) {
      problems.push(`A submission can have at most ${MAX_SUBMISSION_PHOTOS} photos.`);
      break;
    }
    accepted.push(file);
  }
  return { accepted, problems };
}

/**
 * Upload photos one at a time to the private bucket, then record each one.
 * Failures are collected instead of thrown so one bad photo never discards the rest.
 */
export async function uploadSubmissionPhotos(options: {
  companyId: string;
  submissionId: string;
  files: File[];
}): Promise<{ uploaded: number; failures: string[] }> {
  const client = createClient();
  const { data } = await client.auth.getUser();
  const userId = data.user?.id;
  if (!userId) return { uploaded: 0, failures: ['Your session could not be verified. Refresh and try again.'] };

  const bucket = client.storage.from('evidence');
  let uploaded = 0;
  const failures: string[] = [];

  for (const file of options.files) {
    const extension = file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/png' ? 'png' : 'webp';
    const path = `${options.companyId}/inbox/${options.submissionId}/${userId}-${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await bucket.upload(path, file, {
      cacheControl: '3600',
      contentType: file.type,
      upsert: false,
    });
    if (uploadError) {
      failures.push(`${file.name}: the upload failed. Check your connection.`);
      continue;
    }
    const result = await addSubmissionAttachmentAction({
      submissionId: options.submissionId,
      storagePath: path,
      originalFilename: file.name.slice(0, 255),
      mimeType: file.type,
      sizeBytes: file.size,
    });
    if (result.error) {
      failures.push(`${file.name}: ${result.error}`);
      // The record was refused, so remove the orphaned private object.
      await bucket.remove([path]);
      continue;
    }
    uploaded += 1;
  }
  return { uploaded, failures };
}
