import { Router } from "express";
import { validate } from "../../middlewares/validate.middleware";
import { LoginRequestSchema } from "../../schemas/auth.schema";
import { login, me } from "./auth.controller";
import { requireAuth } from "../../middlewares/auth.middleware";

const router = Router();

/**
 * POST /auth/login
 * Login with email and password
 */
router.post("/login", validate("body", LoginRequestSchema), login);

/**
 * GET /auth/me
 * Get current authenticated user (requires JWT token)
 */
router.get("/me", requireAuth(), me);

export default router;
