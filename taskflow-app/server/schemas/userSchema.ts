import { z } from "zod";

export const userRegisterSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email"),
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  password: z.string().min(5, "Password must be at least 5 characters"),
});

export const userLoginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});
