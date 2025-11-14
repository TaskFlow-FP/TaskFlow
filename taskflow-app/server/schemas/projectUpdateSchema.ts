import { z } from 'zod';

export const projectUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
});