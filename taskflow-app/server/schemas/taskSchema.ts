import { z } from "zod";

export const taskCreateSchema = z.object({
  projectId: z.string().trim().min(1, "Project ID is required"),
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().optional(),
  status: z.enum(["backlog", "todo", "in_progress", "done"]).default("todo").optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium").optional(),
  assignedTo: z.array(z.string()).optional(),
  dueDate: z.string().optional(),
});
