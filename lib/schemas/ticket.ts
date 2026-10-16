import { z } from 'zod';

export const ticketStatuses = [
  'draft',
  'ready_for_review',
  'ready_to_export',
  'finalized',
  // Legacy values stay accepted so existing tickets can still be saved.
  'submitted',
  'approved',
  'rejected',
  'invoiced',
] as const;

const optionalText = (max: number) =>
  z
    .union([z.string().trim().max(max), z.null(), z.undefined()])
    .transform((value) => (value ? String(value).trim() || null : null));

export const laborEntrySchema = z.object({
  worker_name: z.string().trim().min(1, 'Add a worker name or role.').max(160),
  hours: z.number().positive('Hours must be greater than zero.').max(10000).multipleOf(0.01, 'Hours can have up to two decimal places.'),
  rate: z.number().min(0, 'Rate cannot be negative.').max(1000000).multipleOf(0.01, 'Rate can have up to two decimal places.'),
});

export const costEntrySchema = z.object({
  description: z.string().trim().min(1, 'Add a description.').max(240),
  quantity: z.number().positive('Quantity must be greater than zero.').max(1000000).multipleOf(0.001, 'Quantity can have up to three decimal places.'),
  unit_cost: z.number().min(0, 'Unit cost cannot be negative.').max(1000000).multipleOf(0.01, 'Unit cost can have up to two decimal places.'),
});

export const ticketSchema = z.object({
  project_id: z.string().uuid('Choose a project.'),
  occurred_at: z.string().datetime({ offset: true, message: 'Enter a valid date and time.' }),
  location: optionalText(250),
  description: z.string().trim().min(1, 'Describe the extra work.').max(12000),
  out_of_scope_reason: optionalText(6000),
  status: z.enum(ticketStatuses),
  gc_representative: optionalText(180),
  notes: optionalText(12000),
  labor: z.array(laborEntrySchema).max(75),
  materials: z.array(costEntrySchema).max(75),
  costs: z.array(costEntrySchema).max(75),
}).refine((value) => value.labor.length + value.materials.length + value.costs.length <= 75, {
  message: 'A ticket can have up to 75 line items in total.',
  path: ['labor'],
});

export type TicketInput = z.infer<typeof ticketSchema>;
