import type { Request, Response } from "express";
import type { LoginRequestSchema } from "../../schemas/auth.schema";
import { authenticateUser, generateToken, getAdminUserById } from "./auth.service";

/**
 * POST /auth/login
 * Authenticate with email/password, return JWT token
 */
export async function login(
  req: Request<unknown, unknown, LoginRequestSchema>,
  res: Response,
) {
  const { email, password } = req.body;

  const user = await authenticateUser(email, password);

  if (!user) {
    res.status(401).json({
      error: {
        message: "Invalid email or password",
        code: "INVALID_CREDENTIALS",
      },
    });
    return;
  }

  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  res.json({
    accessToken: token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
  });
}

/**
 * GET /auth/me
 * Get current authenticated user info
 */
export async function me(req: Request, res: Response) {
  const user = (req as any).user;

  if (!user) {
    res.status(401).json({
      error: {
        message: "Not authenticated",
        code: "UNAUTHORIZED",
      },
    });
    return;
  }

  const adminUser = await getAdminUserById(user.userId);

  if (!adminUser || !adminUser.active) {
    res.status(401).json({
      error: {
        message: "User not found or inactive",
        code: "UNAUTHORIZED",
      },
    });
    return;
  }

  res.json({
    id: adminUser.id,
    email: adminUser.email,
    role: adminUser.role,
    active: adminUser.active,
  });
}
