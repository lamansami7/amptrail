import { describe, expect, it } from 'vitest';
import {
  initialSubmissionStatus,
  manualSubmissionStatuses,
  openSubmissionStatuses,
  resolveTriage,
  submissionExcerpt,
  submissionStatusLabel,
  submissionStatusOptions,
  submissionStatusTone,
} from '@/lib/inbox/status';
import { attachmentSchema, createSubmissionSchema, triageSchema } from '@/lib/schemas/submission';

const PROJECT = '8d1b5c8e-5d0a-4f43-9a52-0c8d2a7e7a11';

describe('inbox statuses', () => {
  it('has the six triage states with labels and tones', () => {
    expect(submissionStatusOptions.map((option) => option.value)).toEqual([
      'new',
      'needs_project',
      'missing_details',
      'ready_for_review',
      'processed',
      'dismissed',
    ]);
    expect(submissionStatusLabel('needs_project')).toBe('Needs project');
    expect(submissionStatusLabel('mystery')).toBe('Unknown');
    expect(submissionStatusTone('ready_for_review')).toBe('success');
    expect(submissionStatusTone('mystery')).toBe('neutral');
  });

  it('treats processed and dismissed as closed, and processed as never hand-set', () => {
    expect(openSubmissionStatuses).not.toContain('processed');
    expect(openSubmissionStatuses).not.toContain('dismissed');
    expect(manualSubmissionStatuses).not.toContain('processed');
    expect(manualSubmissionStatuses).toContain('dismissed');
  });

  it('starts a note as "needs project" unless a project was chosen', () => {
    expect(initialSubmissionStatus(null)).toBe('needs_project');
    expect(initialSubmissionStatus(PROJECT)).toBe('new');
  });
});

describe('triage rules', () => {
  const base = { projectId: null, missingDetails: '' };

  it('refuses to change a closed submission', () => {
    const result = resolveTriage('processed', { ...base, status: 'new' });
    expect(result.ok).toBe(false);
  });

  it('never lets a person mark a note processed by hand', () => {
    const result = resolveTriage('new', { ...base, status: 'processed' });
    expect(result.ok).toBe(false);
    expect(!result.ok && result.error).toMatch(/work ticket/i);
  });

  it('requires a project before "ready for review"', () => {
    expect(resolveTriage('new', { ...base, status: 'ready_for_review' }).ok).toBe(false);
    const ok = resolveTriage('new', { projectId: PROJECT, missingDetails: '', status: 'ready_for_review' });
    expect(ok).toMatchObject({ ok: true, status: 'ready_for_review', projectId: PROJECT });
  });

  it('requires a specific note for "missing details" and keeps it only then', () => {
    expect(resolveTriage('new', { ...base, status: 'missing_details' }).ok).toBe(false);
    expect(resolveTriage('new', { ...base, status: 'missing_details', missingDetails: '   ' }).ok).toBe(false);
    const flagged = resolveTriage('new', {
      projectId: PROJECT,
      status: 'missing_details',
      missingDetails: '  Which date was this?  ',
    });
    expect(flagged).toMatchObject({ ok: true, status: 'missing_details', missingDetails: 'Which date was this?' });
    // A stale note is dropped when the status moves on.
    const moved = resolveTriage('missing_details', {
      projectId: PROJECT,
      status: 'ready_for_review',
      missingDetails: 'Which date was this?',
    });
    expect(moved).toMatchObject({ ok: true, missingDetails: null });
  });

  it('normalizes new / needs-project by whether a project is set', () => {
    expect(resolveTriage('needs_project', { projectId: PROJECT, missingDetails: '', status: 'needs_project' })).toMatchObject({
      ok: true,
      status: 'new',
    });
    expect(resolveTriage('new', { ...base, status: 'new' })).toMatchObject({ ok: true, status: 'needs_project' });
  });

  it('lets a dismissed note be reopened and rejects oversized notes', () => {
    expect(resolveTriage('dismissed', { projectId: PROJECT, missingDetails: '', status: 'new' })).toMatchObject({
      ok: true,
      status: 'new',
    });
    expect(
      resolveTriage('new', { projectId: PROJECT, status: 'missing_details', missingDetails: 'x'.repeat(1001) }).ok
    ).toBe(false);
  });
});

describe('submission validation', () => {
  it('accepts a note, trims it, and turns blanks into null', () => {
    const parsed = createSubmissionSchema.parse({ senderName: '  Mike ', body: '  Extra conduit  ', projectId: '' });
    expect(parsed).toEqual({ senderName: 'Mike', body: 'Extra conduit', projectId: null });
    expect(createSubmissionSchema.parse({ body: 'x', senderName: '' }).senderName).toBeNull();
  });

  it('rejects empty, whitespace-only and oversized notes and bad project ids', () => {
    expect(createSubmissionSchema.safeParse({ body: '' }).success).toBe(false);
    expect(createSubmissionSchema.safeParse({ body: '    ' }).success).toBe(false);
    expect(createSubmissionSchema.safeParse({ body: 'x'.repeat(5001) }).success).toBe(false);
    expect(createSubmissionSchema.safeParse({ body: 'ok', projectId: 'not-a-uuid' }).success).toBe(false);
    expect(createSubmissionSchema.safeParse({ body: 'x'.repeat(5000) }).success).toBe(true);
  });

  it('only accepts hand-settable statuses in a triage request', () => {
    expect(triageSchema.safeParse({ id: PROJECT, status: 'ready_for_review', projectId: PROJECT }).success).toBe(true);
    expect(triageSchema.safeParse({ id: PROJECT, status: 'processed' }).success).toBe(false);
    expect(triageSchema.safeParse({ id: 'nope', status: 'new' }).success).toBe(false);
  });

  it('restricts attachments to private photos of a sane size', () => {
    const valid = {
      submissionId: PROJECT,
      storagePath: 'a/inbox/b/c.jpg',
      originalFilename: 'p.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 1000,
    };
    expect(attachmentSchema.safeParse(valid).success).toBe(true);
    expect(attachmentSchema.safeParse({ ...valid, mimeType: 'application/pdf' }).success).toBe(false);
    expect(attachmentSchema.safeParse({ ...valid, sizeBytes: 11 * 1024 * 1024 }).success).toBe(false);
    expect(attachmentSchema.safeParse({ ...valid, sizeBytes: 0 }).success).toBe(false);
  });
});

describe('excerpts', () => {
  it('collapses whitespace and truncates long notes', () => {
    expect(submissionExcerpt('a\n\n  b   c')).toBe('a b c');
    const long = submissionExcerpt('word '.repeat(100), 40);
    expect(long.length).toBeLessThanOrEqual(40);
    expect(long.endsWith('…')).toBe(true);
  });
});
