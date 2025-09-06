import { Router } from 'express';
import { signIn, signUp } from './auth.controller.js';
import { validate } from '../../middlewares/validate.js';
import { signInSchema, signUpSchema } from './auth.schema.js';

const router = Router();

router.post('/signup', validate(signUpSchema), signUp);
router.post('/signin', validate(signInSchema), signIn);

export default router;
