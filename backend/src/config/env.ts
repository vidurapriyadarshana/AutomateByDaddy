import { z } from "zod";
import type { Env } from "../types";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).optional(),
  PORT: z.coerce.number().int().positive().default(4000),

  // Required once we start using Prisma/DB-backed features.
  DATABASE_URL: z.string().min(1).optional(),
});

export const env: Env = EnvSchema.parse(process.env);
