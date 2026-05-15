/**
 * Authentication and Authorization Types
 */

/**
 * JWT Payload - what gets encoded in the token
 */
export type JwtPayload = {
  userId: bigint;
  email: string;
  role: "admin" | "staff";
};

/**
 * Authenticated User - attached to Express Request
 */
export type AuthenticatedUser = {
  userId: bigint;
  email: string;
  role: "admin" | "staff";
  iat: number;
  exp: number;
};

/**
 * Auth response with JWT token
 */
export type AuthResponse = {
  accessToken: string;
  user: {
    id: bigint;
    email: string;
    role: "admin" | "staff";
  };
};

/**
 * Login request body
 */
export type LoginRequest = {
  email: string;
  password: string;
};
