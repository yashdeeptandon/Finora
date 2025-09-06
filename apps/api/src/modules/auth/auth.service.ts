import { prisma } from '@pkg/db';
import { SignInSchema, SignUpSchema } from '@pkg/schemas';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

type SignUpData = z.infer<typeof SignUpSchema>;
type SignInData = z.infer<typeof SignInSchema>;

class AuthService {
  async signUp(data: SignUpData) {
    const { email, password, firstName, lastName } = data;
    const hashedPassword = await bcrypt.hash(password, 12);
    await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash: hashedPassword,
        name: `${firstName} ${lastName}`,
      },
    });
  }

  async signIn(data: SignInData) {
    const { email, password } = data;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}

export const authService = new AuthService();
