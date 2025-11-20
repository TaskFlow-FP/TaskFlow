import { z } from 'zod';

export const projectUpdateSchema = z.object({
  name: z.string().trim().min(1).optional(),
  description: z.string().trim().optional(),
});