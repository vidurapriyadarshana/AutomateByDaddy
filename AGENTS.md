# AGENTS.md

## Repo Shape
- Two separate npm projects (no root `package.json`): `frontend/` (Vite + React + TS, ESM) and `backend/` (Express + TS, CommonJS, Prisma).
- Real entrypoints: `backend/src/main.ts` and `frontend/src/main.tsx`.
- `docs/folder-structure.md` is aspirational (not the current tree).

## Commands (Use `npm ci`)
- Frontend (run in `frontend/`): `npm ci`, `npm run dev`, `npm run lint`, `npm run build`, `npm run preview`.
- Backend (run in `backend/`): `npm ci`, `npm run dev`, `npm run build`, `npm start`.
  - Dev rebuilds and restarts on file changes (`ts-node-dev --respawn --transpile-only`).
  - Build typechecks with `tsc` first before bundling.

## Backend Gotchas
- Env is loaded via `import "dotenv/config"` in `backend/src/main.ts`; don't add additional dotenv bootstrapping elsewhere.
- `backend/` dev uses `ts-node-dev --respawn --transpile-only` (type errors can slip by); use `npm run build` to typecheck.
- Smoke check: `GET /health` returns `{ "ok": true }` (default `PORT=4000` in `backend/.env.example`).
- API docs: Swagger UI at `GET /docs`, OpenAPI spec at `GET /openapi.json`.
- Backend `npm test` is a placeholder (prints "(no tests yet)").
- JWT_SECRET must be at least 32 characters; check `backend/src/config/env.ts` for validation schema.

## Prisma / DB
- Prisma schema: `backend/prisma/schema.prisma` (MySQL, `DATABASE_URL`).
- Generated client lives in `backend/src/generated/prisma` (gitignored); after schema edits run `npm run prisma:generate` from `backend/`.
- For schema changes that need migrations: run `npm run prisma:migrate` then `npm run prisma:generate` from `backend/`.
- `backend/prisma.config.*` is Prisma-generated (and the built artifacts are gitignored); avoid hand-editing.
- DB access will throw if `DATABASE_URL` is missing or the client isn't generated (`backend/src/db/prisma.ts`).

## MVP Docs (Scope Source)
- PRD: `docs/home-business-automation-prd.md`; ERD: `docs/home-business-automation-erd.md`.
- Backend implementation plan: `docs/backend-implementation-plan.md`; flow diagrams: `docs/flows-*.md`.
