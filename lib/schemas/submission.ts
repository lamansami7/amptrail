import { z } from 'zod';
import { manualSubmissionStatuses } from '@/lib/inbox/status';

const uuidOrNull = z
  .union([z.string().uuid(), z.literal(''), z.null()])
  .optional()
  .transform((value) => (value ? value : null));

export const createSubmissionSchema = z.object({
  senderName: z
    .string()
    .trim()
    .max(120, 'Keep the sender name under 120 characters.')
    .optional()
    .transform((value) => value || null),
  body: z
    .string()
    .trim()
    .min(1, 'Write what happened. The note cannot be empty.')
    .max(5000, 'Keep the note under 5,000 characters.'),
  projectId: uuidOrNull,
});

export const triageSchema = z.object({
  id: z.string().uuid(),
  projectId: uuidOrNull,
  status: z.enum(manualSubmissionStatuses as unknown as [string, ...string[]]),
  missingDetails: z.string().max(1000, 'Keep the missing-details note under 1,000 characters.').default(''),
});

export const attachmentSchema = z.object({
  submissionId: z.string().uuid(),
  storagePath: z.string().min(1).max(600),
  originalFilename: z.string().trim().min(1).max(255),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  sizeBytes: z.number().int().positive().max(10 * 1024 * 1024),
});

export type CreateSubmissionInput = z.input<typeof createSubmissionSchema>;
