import { z } from "zod";

export const projectCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});
