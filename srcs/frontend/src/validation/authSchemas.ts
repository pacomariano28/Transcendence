import { z } from "zod";

export const registerSchema = z.object({
  email: z.email("Invalid email"),
  username: z
    .string()
    .min(1, "Username is required")
    .max(12, "Max 12 characters for user name"),
  password: z
    .string()
    .min(3, "Password requires at least 3 characters ")
    .max(12, "Max 12 characters for password"),
});

export const loginSchema = z.object({
  email: z.email("Invalid email"),
  password: z
    .string()
    .min(3, "Password requires at least 3 characters")
    .max(12, "Max 12 characters for password"),
});

export type RegisterValues = z.infer<typeof registerSchema>;
export type LoginValues = z.infer<typeof loginSchema>;
