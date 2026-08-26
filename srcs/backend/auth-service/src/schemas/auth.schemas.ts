import { z } from "zod";

export const refreshBodySchema = z.object({
  refreshToken: z.string().min(1),
});

export const registerBodySchema = z.object({
  email: z.email(),
  username: z.string().min(1).max(12),
<<<<<<< HEAD
  password: z.string().min(3).max(12),
=======
  password: z.string().min(1).max(12),
>>>>>>> main
});

export const loginBodySchema = z.object({
  email: z.email(),
<<<<<<< HEAD
  password: z.string().min(3),
=======
  password: z.string().min(1),
>>>>>>> main
});
