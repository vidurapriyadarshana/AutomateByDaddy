# Types Directory Structure

This directory contains all TypeScript types and interfaces used throughout the backend. Organizing types in a dedicated folder improves code maintainability and makes it easier to find and manage type definitions.

## Files

### `index.ts`
Central export file. Import all types from here:
```ts
import type { Env, ApiErrorBody, RequestParts, PrismaClient } from "../types";
```

### `api.ts`
API response and error types:
- `ApiErrorBody` - Standardized API error response format
- `ApiResponse<T>` - Standardized API success response format

### `request.ts`
Request handling types:
- `RequestParts` - Literal type for request parts (body|query|params)

### `db.ts`
Database and Prisma types:
- `PrismaClient` - Placeholder type for Prisma client (before generation)

### `env.ts`
Environment configuration types:
- `Env` - Typed environment variables configuration

## Usage

### Direct import from index:
```ts
import type { Env, ApiErrorBody } from "../types";
```

### Specific module import:
```ts
import type { ApiErrorBody } from "../types/api";
```

## Best Practices

1. **Keep types organized by concern** - Add new types to the most relevant file
2. **Always use `type` keyword** - Use `export type` not `export interface` for consistency
3. **Add JSDoc comments** - Document complex types with explanations
4. **Re-export from index.ts** - Always add new types to the central exports
5. **Use exact optional properties** - Respect `exactOptionalPropertyTypes: true` setting

## Adding New Types

1. Create or add to the appropriate file (api.ts, request.ts, db.ts, env.ts)
2. Use `export type` keyword
3. Add a comment explaining the type's purpose
4. Re-export from `index.ts`
5. Update imports in files that use the type

Example:
```ts
// In types/api.ts
export type PagedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

// In types/index.ts
export type { PagedResponse } from "./api";
```
