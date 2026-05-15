/**
 * Environment Configuration Types
 */

export type Env = {
  NODE_ENV?: "development" | "test" | "production" | undefined;
  PORT: number;
  DATABASE_URL?: string | undefined;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  SMTP_HOST?: string | undefined;
  SMTP_PORT: number;
  SMTP_USER?: string | undefined;
  SMTP_PASSWORD?: string | undefined;
  SMTP_FROM?: string | undefined;
  SMTP_ENABLED: string;
};
