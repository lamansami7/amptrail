/**
 * Inbox triage states and the rules for moving between them.
 *
 * These rules are enforced twice: here, so the interface can explain a refusal
 * in plain words, and by CHECK constraints and triggers in the database, so a
 * crafted request cannot skip them.
 */
import type { StatusTone } from '@/lib/tickets/status';

export const submissionStatusOptions = [
  { value: 'new', label: 'New', tone: 'brand', description: 'Logged and not yet looked at.' },
  {
    value: 'needs_project',
    label: 'Needs project',
    tone: 'warning',
    description: 'No project is chosen yet, so a person needs to assign one.',
  },
  {
    value: 'missing_details',
    label: 'Missing details',
    tone: 'violet',
    description: 'Hours, dates or quantities are unclear and need a follow-up.',
  },
  {
    value: 'ready_for_review',
    label: 'Ready for review',
    tone: 'success',
    description: 'Everything needed is present and the office can build the ticket.',
  },
  {
    value: 'processed',
    label: 'Processed',
    tone: 'neutral',
    description: 'Turned into a work ticket. The original stays on file.',
  },
  { value: 'dismissed', label: 'Dismissed', tone: 'neutral', description: 'Set aside. The original stays on file.' },
] as const satisfies ReadonlyArray<{ value: string; label: string; tone: StatusTone; description: string }>;

export type SubmissionStatus = (typeof submissionStatusOptions)[number]['value'];

export const submissionStatusValues = submissionStatusOptions.map((option) => option.value) as [
  SubmissionStatus,
  ...SubmissionStatus[],
];

/** Statuses that still need someone's attention. */
export const openSubmissionStatuses: readonly SubmissionStatus[] = [
  'new',
  'needs_project',
  'missing_details',
  'ready_for_review',
];

/** Statuses a person can set by hand. `processed` is only reached by creating a ticket. */
export const manualSubmissionStatuses: readonly SubmissionStatus[] = [
  'new',
  'needs_project',
  'missing_details',
  'ready_for_review',
  'dismissed',
];

export function submissionStatusLabel(status: string) {
  return submissionStatusOptions.find((option) => option.value === status)?.label ?? 'Unknown';
}

export function submissionStatusTone(status: string): StatusTone {
  return submissionStatusOptions.find((option) => option.value === status)?.tone ?? 'neutral';
}

/** A new note starts as "Needs project" unless the sender already chose one. */
export function initialSubmissionStatus(projectId: string | null): SubmissionStatus {
  return projectId ? 'new' : 'needs_project';
}

export type TriageRequest = {
  status: SubmissionStatus;
  projectId: string | null;
  missingDetails: string;
};

export type TriageResult =
  | { ok: true; status: SubmissionStatus; projectId: string | null; missingDetails: string | null }
  | { ok: false; error: string };

/**
 * Decide what a triage request actually means.
 *
 * - A closed (processed) submission cannot change.
 * - "Ready for review" needs a project; "Missing details" needs a note saying what is missing.
 * - "New" and "Needs project" are two names for the same early state, chosen by whether a
 *   project is set, so a request is normalized rather than rejected.
 * - A missing-details note is only kept while the status is "Missing details".
 */
export function resolveTriage(currentStatus: string, request: TriageRequest): TriageResult {
  if (currentStatus === 'processed') {
    return { ok: false, error: 'This submission is closed because it was turned into a ticket.' };
  }
  if (!manualSubmissionStatuses.includes(request.status)) {
    return {
      ok: false,
      error: 'Create a work ticket from this submission to mark it processed.',
    };
  }

  const note = request.missingDetails.trim();
  let status = request.status;

  if (status === 'new' || status === 'needs_project') {
    status = request.projectId ? 'new' : 'needs_project';
  }
  if (status === 'ready_for_review' && !request.projectId) {
    return { ok: false, error: 'Choose a project before marking this ready for review.' };
  }
  if (status === 'missing_details' && note.length === 0) {
    return { ok: false, error: 'Say what is missing so the follow-up is specific.' };
  }
  if (note.length > 1000) {
    return { ok: false, error: 'Keep the missing-details note under 1,000 characters.' };
  }

  return {
    ok: true,
    status,
    projectId: request.projectId,
    missingDetails: status === 'missing_details' ? note : null,
  };
}

export function submissionExcerpt(body: string, max = 140) {
  const flat = body.replace(/\s+/g, ' ').trim();
  return flat.length > max ? `${flat.slice(0, max - 1).trimEnd()}…` : flat;
}

export const MAX_SUBMISSION_PHOTOS = 10;
