import { z } from 'zod';

export const settingsSchema = z.object({
  full_name: z.string().trim().max(120, 'Name must be 120 characters or fewer.').transform((value) => value || null),
  company_name: z.string().trim().min(1, 'Enter your company name.').max(160, 'Company name must be 160 characters or fewer.'),
});
