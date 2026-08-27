import { z } from "zod";

export const registerSchema = z.object({
  // Use z.email() directly instead of z.string().email()
  email: z.email({ message: "validation.invalid_email" }),
  username: z
    .string()
    .min(1, "validation.username_required")
    .max(12, "validation.username_too_long"),
  password: z
    .string()
    .min(3, "validation.password_too_short")
    .max(12, "validation.password_too_long"),
});

export const loginSchema = z.object({
  // Fix it here as well
  email: z.email({ message: "validation.invalid_email" }),
  password: z
    .string()
    .min(3, "validation.password_too_short")
    .max(12, "validation.password_too_long"),
});

export type RegisterValues = z.infer<typeof registerSchema>;
export type LoginValues = z.infer<typeof loginSchema>;
