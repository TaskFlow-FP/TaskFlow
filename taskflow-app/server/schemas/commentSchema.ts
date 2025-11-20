import { z } from "zod";

export const commentCreateSchema = z.object({
  taskId: z.string().trim().min(1, "Task ID is required"),
  content: z.string().trim().min(1, "Comment content is required").max(1000, "Comment is too long"),
});

export const commentUpdateSchema = z.object({
  content: z.string().trim().min(1, "Comment content is required").max(1000, "Comment is too long"),
});
