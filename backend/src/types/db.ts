/**
 * Database and Prisma Types
 */

/**
 * Placeholder PrismaClient type used before client is generated.
 * Once Prisma generates the client at src/generated/prisma,
 * callers should import types directly from that module.
 */
export type PrismaClient = {
  $disconnect(): Promise<void>;
} & Record<string, unknown>;
