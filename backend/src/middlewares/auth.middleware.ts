import type { NextFunction, Request, RequestHandler, Response } from "express";
import { verifyToken } from "../modules/auth/auth.service";
import type { AuthenticatedUser } from "../types";

/**
 * Attach authenticated user to req.user if valid JWT token provided
 * This is not a strict requirement - it's optional auth
 */
export function attachAuth(): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next();
    }

    const token = authHeader.slice(7);

    try {
      const user = verifyToken(token);
      (req as any).user = user;
    } catch (err) {
      // Token is invalid/expired, but we don't fail the request.
      // Routes can later check if req.user exists.
    }

    next();
  };
}

/**
 * Require authentication - fail if no valid JWT token
 * Optional role check: pass role name(s) to restrict to specific roles
 */
export function requireAuth(allowedRoles?: string[] | string): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user as AuthenticatedUser | undefined;

    if (!user) {
      res.status(401).json({
        error: {
          message: "Missing or invalid authentication token",
          code: "UNAUTHORIZED",
        },
      });
      return;
    }

    const allowedRolesList = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    if (allowedRolesList.length > 0 && !allowedRolesList.includes(user.role)) {
      res.status(403).json({
        error: {
          message: "Insufficient permissions",
          code: "FORBIDDEN",
        },
      });
      return;
    }

    next();
  };
}
