# Backend Implementation Plan

This plan implements the **backend** described in `docs/home-business-automation-prd.md` using the **intended folder structure** in `docs/folder-structure.md`.

If we need to implement anything outside the scope of the docs (new major features, new data model, new flows, new integrations/providers), stop and ask before changing docs or code.

## Target Outcomes (MVP)
- Product catalog with variants + inventory.
- Website checkout: COD + bank transfer slip upload.
- Admin APIs: manage products, review slips, manage orders + statuses.
- Email notifications on order confirmation and status changes.
- WhatsApp webhook + messaging scaffolding (provider choice gated by docs open questions).

## Folder Structure To Implement

Backend root: `backend/`

- `src/main.ts`: process boot (loads env, starts server).
- `src/app.ts`: express app wiring.
- `src/config/`: env parsing, constants, logger.
- `src/db/`: Prisma client + DB helpers/transactions.
- `src/modules/`: feature-first modules (routes/controller/service/schemas).
- `src/middlewares/`: auth, error handling, request validation.
- `src/utils/`: idempotency, pagination, money.
- `src/jobs/`: queue + workers for async side effects (email, WhatsApp).
- `prisma/schema.prisma`: DB schema.
- `prisma/migrations/`: Prisma migrations.
- `tests/`: unit/integration tests (framework TBD).
- `scripts/`: local dev helpers (optional).

## Phase 0: Baseline Wiring (No Product Features Yet)

### 0.1 App wiring
1. Expand `src/app.ts`:
1. Add request id correlation.
1. Add central error middleware (consistent error shape).
1. Add `GET /health` (already exists) and `GET /version` (commit/hash optional).
1. Add API docs: `GET /openapi.json` and Swagger UI at `/docs`.

### 0.2 Env management
1. Create `src/config/env.ts`:
1. Parse required env vars with Zod.
1. Export a typed `env` object used everywhere.
1. Keep `import "dotenv/config"` only in `src/main.ts` (do not re-add elsewhere).

### 0.3 Prisma client
1. Create `src/db/prisma.ts`:
1. Instantiate PrismaClient once.
1. Handle graceful shutdown (process signals).
1. Ensure generated client path stays `src/generated/prisma` (already configured).

### 0.4 Request validation helper
1. Create `src/middlewares/validate.middleware.ts`:
1. Validate `params`, `query`, `body` using Zod.
1. Standardize 400 responses for validation errors.

### 0.5 Verification
1. `backend/`: `npm ci`
1. `npm run build`
1. `npm run dev` then `GET http://localhost:4000/health` and open `http://localhost:4000/docs`.

## Phase 1: Data Model + Migrations (Prisma)

### 1.1 Implement ERD models
Add Prisma models matching `docs/home-business-automation-erd.md`:
- `Product`, `Variant`
- `Customer`, `Address`
- `SalesOrder`, `OrderItem`
- `Payment`
- `MessageThread`, `Message`
- `AdminUser`
- `AuditLog`

Constraints to encode early:
- Unique `Variant.sku`.
- Unique `AdminUser.email`.
- Unique `SalesOrder.orderNumber`.
- Monetary fields as `Decimal` (Prisma) mapped to MySQL `DECIMAL`.
- Enum-like fields: order `channel`, payment `method/state`, message `direction`.

### 1.2 Migration workflow
1. Update `prisma/schema.prisma`.
1. Run `npm run prisma:migrate`.
1. Run `npm run prisma:generate`.

### 1.3 Seed (optional, gated)
If seed data is needed for local dev, add a `prisma/seed/seed.ts` and a script.

## Phase 2: Auth + Admin User

Goal: secure admin endpoints.

### 2.1 Auth approach (decision point)
Implement one of:
1. Session cookies.
1. JWT bearer tokens.

Stop and ask before choosing if the docs do not specify.

### 2.2 Module: `modules/auth/`
- Routes:
- `POST /auth/login`
- `POST /auth/logout` (if session-based)
- `GET /auth/me`

- Schemas:
- login input.

- Service:
- password hashing/verification.

### 2.3 Middleware: `middlewares/auth.middleware.ts`
- Require admin/staff role.
- Attach `req.user` typed.

### 2.4 Audit logging hook
- Create helper to record admin actions into `AuditLog`.

## Phase 3: Products + Variants

### 3.1 Module: `modules/products/`
- Routes:
- `GET /products` (public)
- `GET /products/:id` (public)
- `POST /admin/products` (admin)
- `PATCH /admin/products/:id` (admin)
- `POST /admin/products/:id/variants` (admin)
- `PATCH /admin/variants/:id` (admin)

- Behaviors:
- SKU lookup endpoint for WhatsApp and internal tools.
- Inventory updates per variant.

### 3.2 Money utilities
- `utils/money.ts` for Decimal handling and formatting boundaries (never use floating math in services).

### 3.3 Verification
- Prisma CRUD roundtrip.
- Basic list endpoints return stable shapes.

## Phase 4: Customers + Addresses

### 4.1 Module: `modules/customers/`
- Routes:
- `GET /admin/customers`
- `GET /admin/customers/:id`

### 4.2 Address handling
- Create/update addresses during checkout.
- Keep historical order address stable (order points to a specific address row).

## Phase 5: Checkout + Orders

### 5.1 Module: `modules/orders/`
- Routes (public web):
- `POST /checkout` (create order + payment intent details)
- `GET /orders/:orderNumber` (public status lookup, gated by a secret token or phone/email verification)

- Routes (admin):
- `GET /admin/orders`
- `GET /admin/orders/:id`
- `PATCH /admin/orders/:id/status`
- `POST /admin/orders/:id/notes`

### 5.2 Order numbering
- Generate `orderNumber` (human-friendly, unique, non-guessable enough for public status endpoint).

### 5.3 Status pipeline
- Implement statuses from PRD (`new`, `pending_payment`, `payment_review`, `confirmed`, `processing`, `shipped`, `delivered`, `cancelled`, `refunded`).
- Enforce allowed transitions in service layer.

### 5.4 Pagination
- `utils/pagination.ts` with consistent `page`/`pageSize` or cursor.

## Phase 6: Payments + Slip Upload

### 6.1 Module: `modules/payments/`
- Routes (public web):
- `POST /payments/slip` (upload slip, returns URL/id)
- `POST /checkout` should accept slip reference for bank transfer.

- Routes (admin):
- `GET /admin/payments/:id`
- `POST /admin/payments/:id/verify`
- `POST /admin/payments/:id/reject`

### 6.2 File storage (decision point)
Implement one of:
1. Local disk storage (dev-only).
1. Object storage (S3-compatible).

Stop and ask before choosing if the docs do not specify.

### 6.3 Webhook idempotency helper
- `utils/idempotency.ts` keyed by provider event id + type.

## Phase 7: Email Notifications

### 7.1 Module: `modules/messaging/`
- Email client wrapper + templates.
- Use a job queue to send emails asynchronously.

### 7.2 Jobs
- `jobs/queue.ts` minimal queue abstraction.
- `jobs/workers/send-email.worker.ts`.

### 7.3 Trigger points
- On order created.
- On status transitions.
- On payment verified/rejected.

## Phase 8: WhatsApp Provider Integration (Scaffold)

This is gated by provider choice in PRD open questions.

### 8.1 Module: `modules/webhooks/`
- Routes:
- `GET /webhooks/whatsapp` (verification challenge)
- `POST /webhooks/whatsapp` (inbound events)

### 8.2 Module: `modules/messaging/`
- WhatsApp client wrapper.
- Store inbound/outbound messages in `MessageThread` and `Message`.

### 8.3 Templates
- Add template storage (DB) only after the provider constraints are confirmed.

## Phase 9: Testing + CI (Gated)

Current repo has no real backend test runner.

If we add tests:
- Pick a framework (Vitest/Jest) and document the commands.
- Integration tests will require a MySQL database (docker-compose or local) and a clean migration step.

Stop and ask before introducing a test framework or CI if not already desired.

## Implementation Todo List (Ordered)

1. Create `src/config/env.ts` and centralize env access.
1. Add error middleware + validation middleware.
1. Add `src/db/prisma.ts` with a single PrismaClient.
1. Implement Prisma schema models from ERD.
1. Run migrations + generate client.
1. Implement admin auth module + auth middleware.
1. Implement products module (Product + Variant CRUD).
1. Implement customers module (admin list/details).
1. Implement checkout + orders module.
1. Implement payment module + slip upload flow.
1. Implement email sending via job queue.
1. Scaffold WhatsApp webhook + message persistence.
1. Add audit log helper and wire into admin actions.

## Non-Obvious Verification Steps
Run these from `backend/`:
- `npm run build` (real typecheck; `dev` is `--transpile-only`).
- `npm run prisma:migrate` after schema changes.
- `npm run prisma:generate` after schema changes.
