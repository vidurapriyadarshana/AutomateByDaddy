# AGENTS.md

## Repo Shape
- Two separate npm projects (no root `package.json`): `frontend/` (Vite + React 19 + TS, ESM) and `backend/` (Express 5 + TS, CommonJS, Prisma + MySQL).
- Entrypoints: `backend/src/main.ts` and `frontend/src/main.tsx`.

## Commands
Always use `npm ci` in the respective project directory (not `npm install`).
- **Frontend** (`frontend/`): `npm run dev`, `npm run lint`, `npm run build` (runs `tsc -b && vite build` — uses TS project references), `npm run preview`.
- **Backend** (`backend/`): `npm run dev` (ts-node-dev --respawn --transpile-only — type errors can slip by), `npm run build` (full `tsc` typecheck), `npm start`, `npm test` (vitest run), `npm run test:watch` (vitest interactive watch mode).
- **Prisma** (from `backend/`): `npm run prisma:generate`, `npm run prisma:migrate`, `npm run prisma:studio`.

## Backend Gotchas
- **dotenv**: Loaded via `import "dotenv/config"` in `main.ts` — don't add additional dotenv bootstrapping.
- **TypeScript strict mode**: `exactOptionalPropertyTypes: true`. Spread optional fields with conditional spread (`...(value ? { field: value } : {})`), not `string | undefined`.
- **Prisma client**: Never use `new PrismaClient()`. Use `getPrisma() as any` from `src/db/prisma.ts` (lazy loads generated client). Throws if `DATABASE_URL` missing or client not generated.
- **Generated files**: Prisma client lives at `backend/src/generated/prisma` (gitignored). Run `npm run prisma:generate` after schema edits.
- **Money**: All stored as Prisma `Decimal` (MySQL `DECIMAL`). Use `toDecimal()` / `formatDecimal()` from `src/utils/money.ts`. No floating point.
- **Env validation**: Zod schema in `src/config/env.ts`. `JWT_SECRET` ≥ 32 chars, `PORT` defaults to 4000, `DATABASE_URL` optional at parse time (errors at runtime).
- **Express 5**: Has native async error handling. Handlers still use `as unknown as RequestHandler` casts.
- **OpenAPI spec**: Hand-written in `src/openapi.ts` (not generated from routes). May drift from actual endpoints.

## Route Mounting Quirks
- **Products**: Public and admin routes share one router mounted at `/products`. Admin endpoints sit under `/products/admin/products/...` — **not** at `/admin/products` (unlike customers/orders).
- **Orders**: Public `GET /orders/:orderNumber` registered before admin `GET /orders/:id`. Both match the same pattern — admin detail route is shadowed. Admin list at `GET /orders/`.
- **Customers**: Properly isolated at `/admin/customers`.
- **Payments**: Public `POST /payments/slip` (file upload). Admin routes at `/admin/payments/:id/...`.
- Smoke check: `GET /health` → `{ "ok": true }`. Swagger UI at `GET /docs`.

## Auth
- `attachAuth()` (optional — attaches user if JWT present), `requireAuth(role?)` (guards routes, 401/403).
- Admin routes require `Authorization: Bearer <token>`.

## Logging (Winston + Morgan)
- Import `logger` from `src/config/logger.config.ts`. Morgan piped through Winston (`short` format). Files: `logs/app.log`, `logs/error.log`, `logs/exceptions.log`. Level from `LOG_LEVEL` env var. See `backend/docs/LOGGING.md`.

## Email / WhatsApp (In-Memory Job Queue)
- **Queue**: `src/jobs/queue.ts` — 1 job/sec, 3 retry attempts. Workers registered in `main.ts`. Add jobs via `jobQueue.addJob(type, data)`.
- **Email**: Nodemailer via SMTP config in `.env`. Templates in `src/utils/email-templates.ts`.
- **WhatsApp**: Mock scaffold in `src/config/whatsapp.config.ts`. Endpoints: `GET /webhooks/whatsapp/qr`, `GET /webhooks/whatsapp/status`, `POST /webhooks/whatsapp/logout`, `POST /webhooks/whatsapp/reinit`.

## Frontend
- Vite + React 19 + TypeScript (ESM). Empty scaffold (no API calls). `tsconfig.json` uses project references (`tsconfig.app.json` + `tsconfig.node.json`). ESLint flat config (`eslint.config.js`).

## Docs
- PRD: `docs/home-business-automation-prd.md`; ERD: `docs/home-business-automation-erd.md`.
- Implementation plan: `docs/backend-implementation-plan.md`; flow diagrams: `docs/flows-*.md`.
- Per-module testing guides: `backend/src/modules/*/TESTING*.md`.
- `docs/folder-structure.md` is aspirational (describes `shared/`, `docker/`, root `package.json` that don't exist).
