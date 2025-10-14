import bcrypt from 'bcrypt';
import { prisma } from '../config/database';
import type { User, AuthRequest, LoginRequest } from '../types';

export class AuthService {
  private static readonly SALT_ROUNDS = 12;

  static async register(data: AuthRequest): Promise<User> {
    const { username, email, password } = data;

    try {
      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email },
            { username }
          ]
        }
      });

      if (existingUser) {
        throw new Error('User with this email or username already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, this.SALT_ROUNDS);

      // Create user in transaction to ensure data consistency
      const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            username,
            email,
            password: hashedPassword
          }
        });

        // Create initial score record
        await tx.score.create({
          data: {
            userId: user.id,
            score: 0
          }
        });

        return user;
      });

      return result;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  static async login(data: LoginRequest): Promise<User> {
    const { email, password } = data;

    try {
      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        throw new Error('Invalid credentials');
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        throw new Error('Invalid credentials');
      }

      return user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  static async getUserById(id: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { id }
    });
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { email }
    });
  }

  static async getUserByUsername(username: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { username }
    });
  }
}
