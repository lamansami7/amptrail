import { z } from 'zod';

const optionalText = (max: number) => z.string().trim().max(max).transform((value) => value || null);

export const projectSchema = z.object({
  name: z.string().trim().min(1, 'Enter a project name.').max(180, 'Project name must be 180 characters or fewer.'),
  project_number: optionalText(80),
  site_address: optionalText(500),
  general_contractor: optionalText(180),
  notes: optionalText(10000),
});

export type ProjectInput = z.infer<typeof projectSchema>;
