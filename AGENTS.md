# AGENTS.md

## Repo Layout
- Two independent npm projects: `frontend/` (Vite + React + TypeScript, ESM) and `backend/` (Express + TypeScript, CommonJS, Prisma).
- No root `package.json`; run commands from the package folder you are working in.
- `docs/folder-structure.md` is aspirational; current code is much smaller (backend is essentially `src/main.ts` + `src/app.ts`, frontend is close to the Vite template).

## /init: Docs First
- When starting work via `/init`, read `docs/*.md` first and implement changes consistent with those documents.
- If a change would add new scope not covered by `docs/*.md` (new major features, new data model, new flows), stop and ask before updating docs or implementing.

## Docs Index (Keep Updated)
- `docs/home-business-automation-prd.md`: product requirements doc (goals, flows, MVP scope, open questions).
- `docs/home-business-automation-erd.md`: proposed MySQL ERD (entities/relationships) in Mermaid.
- `docs/folder-structure.md`: intended monorepo folder layout and module breakdown (aspirational vs current code).
- `docs/backend-implementation-plan.md`: backend module-by-module implementation plan aligned to PRD/ERD + intended folder structure.
- `docs/flows-customer-admin.md`: customer + admin/staff MVP flows with Mermaid diagrams.
- `docs/flows-backend-frontend-whatsapp.md`: separated backend, frontend, and WhatsApp flow diagrams.
- If a new `docs/*.md` file is added, add it to this list with a one-line summary.

## Install / Run
- Use `npm ci` (lockfiles live in `frontend/package-lock.json` and `backend/package-lock.json`).
- Frontend (run in `frontend/`): `npm run dev`, `npm run lint`, `npm run build`, `npm run preview`.
- Backend (run in `backend/`): `npm run dev`, `npm run build`, `npm start`.

## Verification
- Backend `npm run dev` uses `--transpile-only` (type errors can slip by); use `npm run build` to typecheck.

## Backend Env + DB
- Env is loaded via `import "dotenv/config"` in `backend/src/main.ts` (do not add extra dotenv bootstrapping).
- Prisma/DB requires `DATABASE_URL` (MySQL). Use `backend/.env.example` as the template.
- `backend/.env` is gitignored; do not commit secrets.

## Prisma Gotchas
- Prisma schema: `backend/prisma/schema.prisma` (MySQL).
- Prisma client output is `backend/src/generated/prisma` (gitignored). After editing the schema, run `npm run prisma:generate`.
- For schema changes that need migrations, use `npm run prisma:migrate`.
- `backend/prisma.config.*` is Prisma-generated; avoid hand-editing.

## Quick Smoke Checks
- Backend health endpoint: `GET /health` returns `{ "ok": true }` (default `PORT=4000`).
- Backend `npm test` is currently a placeholder; do not assume tests exist.
