# Logging Guide

Winston (application logs) + Morgan (HTTP request logs) are used throughout the backend.

## Quick Reference

| Category | Logger Method | Output File |
|----------|--------------|-------------|
| App events | `logger.info(...)` | `logs/app.log` |
| Warnings | `logger.warn(...)` | `logs/app.log` |
| Errors | `logger.error(...)` | `logs/app.log` + `logs/error.log` |
| Uncaught exceptions | auto-caught | `logs/exceptions.log` |
| HTTP requests | Morgan → `logger.info(...)` | `logs/app.log` |

## Log Level

Controlled by `LOG_LEVEL` in `.env`:

```
LOG_LEVEL="info"
```

Available: `error`, `warn`, `info`, `debug`

## Log Format

```
[2026-05-15 10:00:00] [INFO   ] Server started on port 4000
[2026-05-15 10:00:01] [ERROR  ] Database connection failed  { "retry": 3 }
```

- Timestamp, level (padded 7 chars), message
- Optional metadata as JSON
- Stack traces on error level

## Morgan HTTP Logs

All HTTP requests are logged via Morgan in `short` format piped through the Winston stream:

```
::1 GET /health 200 2ms - 15
::1 POST /checkout 201 145ms - 512
```

## Usage in Code

```ts
import { logger } from "./config/logger.config";

// Simple message
logger.info("Server started");

// With metadata
logger.warn("Email delivery failed", { retry: 3, email: "user@example.com" });

// With error object
logger.error("Database query failed", { query: "SELECT ...", error: String(err) });

// With stack trace (error level automatically captures stack)
try {
  throw new Error("Something broke");
} catch (e) {
  logger.error("Operation failed", e);
}
```

## File Rotation

- `logs/app.log` - up to 5MB, 5 rotated files
- `logs/error.log` - error-level only, up to 5MB, 5 rotated files
- `logs/exceptions.log` - uncaught exceptions

Add `logs/` to `.gitignore`.
