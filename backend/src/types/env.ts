/**
 * Environment Configuration Types
 */

export type Env = {
  NODE_ENV?: "development" | "test" | "production" | undefined;
  PORT: number;
  DATABASE_URL?: string | undefined;
};
