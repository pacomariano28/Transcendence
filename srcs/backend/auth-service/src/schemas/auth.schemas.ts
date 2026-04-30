import { z } from "zod";

export const refreshBodySchema = z.object({
  refreshToken: z.string().min(1),
});

export const registerBodySchema = z.object({
  email: z.email(),
  username: z.string().min(1).max(12),
  password: z.string().min(1).max(12),
});

export const loginBodySchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});
