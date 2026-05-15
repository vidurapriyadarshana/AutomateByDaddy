import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import { getPrisma } from "../../db/prisma";
import { env } from "../../config/env";
import type { JwtPayload, AuthenticatedUser } from "../../types";

const SALT_ROUNDS = 10;

/**
 * Hash a plain text password using bcrypt
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

/**
 * Compare a plain text password against a hash
 */
export async function verifyPassword(plainPassword: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainPassword, hash);
}

/**
 * Generate a JWT token for an admin user
 */
export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as any,
  });
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): AuthenticatedUser {
  const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload & {
    iat: number;
    exp: number;
  };

  return {
    userId: decoded.userId,
    email: decoded.email,
    role: decoded.role,
    iat: decoded.iat,
    exp: decoded.exp,
  };
}

/**
 * Authenticate admin user by email and password
 * Returns null if user not found or password incorrect
 */
export async function authenticateUser(email: string, password: string) {
  const prisma = getPrisma() as any;

  const user = await prisma.adminUser.findUnique({
    where: { email },
  });

  if (!user || !user.active) {
    return null;
  }

  const isPasswordValid = await verifyPassword(password, user.passwordHash);
  if (!isPasswordValid) {
    return null;
  }

  return user;
}

/**
 * Get admin user by ID
 */
export async function getAdminUserById(userId: bigint) {
  const prisma = getPrisma() as any;

  return prisma.adminUser.findUnique({
    where: { id: userId },
  });
}
