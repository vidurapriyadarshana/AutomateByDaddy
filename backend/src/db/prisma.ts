import { env } from "../config/env";
import type { PrismaClient } from "../types";

let prisma: PrismaClient | undefined;

function loadGeneratedPrismaClient(): { PrismaClient: new () => PrismaClient } {
  // Prisma client is generated to `src/generated/prisma` (gitignored).
  // We `require` it so the backend can still build even before `prisma generate`.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require("../generated/prisma");
}

export function getPrisma() {
  if (prisma) return prisma;

  if (!env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is not set. Create backend/.env from backend/.env.example.",
    );
  }

  try {
    const { PrismaClient: GeneratedPrismaClient } = loadGeneratedPrismaClient();
    prisma = new GeneratedPrismaClient();
    return prisma;
  } catch (e) {
    throw new Error(
      "Prisma client is not generated. Run `npm run prisma:generate` from backend/.",
      { cause: e },
    );
  }
}

let didRegisterShutdown = false;

export function registerPrismaShutdownHooks() {
  if (didRegisterShutdown) return;
  didRegisterShutdown = true;

  const shutdown = async () => {
    try {
      await prisma?.$disconnect();
    } finally {
      // no-op
    }
  };

  process.on("SIGINT", () => {
    void shutdown();
  });
  process.on("SIGTERM", () => {
    void shutdown();
  });
}
