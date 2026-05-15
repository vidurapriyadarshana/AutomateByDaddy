/**
 * Authentication Request/Response Schemas (Zod)
 */

import { z } from "zod";

export const LoginRequestSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export type LoginRequestSchema = z.infer<typeof LoginRequestSchema>;

export const AuthResponseSchema = z.object({
  accessToken: z.string(),
  user: z.object({
    id: z.bigint(),
    email: z.string(),
    role: z.enum(["admin", "staff"]),
  }),
});

export type AuthResponseSchema = z.infer<typeof AuthResponseSchema>;
