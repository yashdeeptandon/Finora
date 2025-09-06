import { z } from 'zod';

export const SignUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string(),
  lastName: z.string(),
});

export const SignInSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});
