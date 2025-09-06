import { Request, Response } from 'express';
import { z } from 'zod';
import { SignInSchema, SignUpSchema } from '@pkg/schemas';
import { authService } from './auth.service.js';

export const signUp = async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName } = SignUpSchema.parse(req.body);
    await authService.signUp({ email, password, firstName, lastName });
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    // Handle other errors
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const signIn = async (req: Request, res: Response) => {
  try {
    const { email, password } = SignInSchema.parse(req.body);
    const user = await authService.signIn({ email, password });
    res.status(200).json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    if (error instanceof Error && error.message === 'Invalid credentials') {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};
