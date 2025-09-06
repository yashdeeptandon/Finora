import { z } from 'zod';

export const signUpSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
  }),
});

export const signInSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string(),
  }),
});
