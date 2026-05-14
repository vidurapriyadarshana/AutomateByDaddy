# Folder Structure (React Vite + Node.js + MySQL + Prisma)

## Repository Layout (Monorepo)

```text
.
├─ backend/
├─ frontend/
├─ shared/
├─ docs/
├─ docker/
├─ .env.example
├─ package.json
└─ README.md
```

## Backend (`backend/`)

```text
backend/
├─ package.json
├─ tsconfig.json
├─ prisma/
│  ├─ schema.prisma
│  ├─ migrations/
│  └─ seed/
│     └─ seed.ts
├─ src/
│  ├─ main.ts
│  ├─ app.ts
│  ├─ config/
│  │  ├─ env.ts
│  │  ├─ logger.ts
│  │  └─ constants.ts
│  ├─ db/
│  │  ├─ prisma.ts
│  │  └─ transactions.ts
│  ├─ modules/
│  │  ├─ auth/
│  │  │  ├─ auth.routes.ts
│  │  │  ├─ auth.controller.ts
│  │  │  ├─ auth.service.ts
│  │  │  └─ auth.schemas.ts
│  │  ├─ users/
│  │  │  ├─ users.routes.ts
│  │  │  ├─ users.controller.ts
│  │  │  └─ users.service.ts
│  │  ├─ products/
│  │  │  ├─ products.routes.ts
│  │  │  ├─ products.controller.ts
│  │  │  ├─ products.service.ts
│  │  │  └─ products.schemas.ts
│  │  ├─ customers/
│  │  │  ├─ customers.routes.ts
│  │  │  ├─ customers.controller.ts
│  │  │  └─ customers.service.ts
│  │  ├─ orders/
│  │  │  ├─ orders.routes.ts
│  │  │  ├─ orders.controller.ts
│  │  │  ├─ orders.service.ts
│  │  │  └─ orders.schemas.ts
│  │  ├─ payments/
│  │  │  ├─ payments.routes.ts
│  │  │  ├─ payments.controller.ts
│  │  │  └─ payments.service.ts
│  │  ├─ webhooks/
│  │  │  ├─ whatsapp.webhook.ts
│  │  │  ├─ gateway.webhook.ts
│  │  │  └─ webhooks.routes.ts
│  │  ├─ messaging/
│  │  │  ├─ whatsapp.client.ts
│  │  │  ├─ email.client.ts
│  │  │  ├─ templates.service.ts
│  │  │  └─ messaging.service.ts
│  │  └─ files/
│  │     ├─ uploads.controller.ts
│  │     ├─ storage.service.ts
│  │     └─ files.routes.ts
│  ├─ middlewares/
│  │  ├─ auth.middleware.ts
│  │  ├─ error.middleware.ts
│  │  └─ validate.middleware.ts
│  ├─ utils/
│  │  ├─ idempotency.ts
│  │  ├─ pagination.ts
│  │  └─ money.ts
│  └─ jobs/
│     ├─ queue.ts
│     └─ workers/
│        ├─ send-email.worker.ts
│        └─ send-whatsapp.worker.ts
├─ tests/
│  ├─ integration/
│  └─ unit/
└─ scripts/
   ├─ dev.ps1
   └─ migrate.ps1
```

Notes:
- `prisma/` holds Prisma schema + migrations for MySQL.
- `modules/` is feature-first (orders, products, payments, webhooks).
- `webhooks/` handles WhatsApp inbound messages/media and payment gateway webhooks.
- `files/` handles payment slip uploads from the website and storing media from WhatsApp.
- Backend serves Swagger UI at `/docs` and OpenAPI JSON at `/openapi.json`.

## Frontend (`frontend/`)

```text
frontend/
├─ package.json
├─ vite.config.ts
├─ tsconfig.json
├─ index.html
├─ public/
│  └─ assets/
└─ src/
   ├─ main.tsx
   ├─ app/
   │  ├─ App.tsx
   │  ├─ router.tsx
   │  └─ providers.tsx
   ├─ api/
   │  ├─ http.ts
   │  ├─ auth.api.ts
   │  ├─ products.api.ts
   │  ├─ orders.api.ts
   │  ├─ payments.api.ts
   │  └─ webhooks.api.ts
   ├─ components/
   │  ├─ layout/
   │  ├─ forms/
   │  └─ ui/
   ├─ pages/
   │  ├─ admin/
   │  │  ├─ DashboardPage.tsx
   │  │  ├─ OrdersPage.tsx
   │  │  ├─ OrderDetailsPage.tsx
   │  │  ├─ ProductsPage.tsx
   │  │  ├─ CustomersPage.tsx
   │  │  └─ SettingsPage.tsx
   │  ├─ store/
   │  │  ├─ HomePage.tsx
   │  │  ├─ ProductListPage.tsx
   │  │  ├─ ProductDetailsPage.tsx
   │  │  ├─ CartPage.tsx
   │  │  └─ CheckoutPage.tsx
   │  └─ auth/
   │     └─ LoginPage.tsx
   ├─ features/
   │  ├─ cart/
   │  ├─ checkout/
   │  ├─ order-status/
   │  └─ payment-slip/
   ├─ state/
   │  ├─ auth.store.ts
   │  └─ cart.store.ts
   ├─ styles/
   │  └─ globals.css
   ├─ utils/
   │  ├─ formatMoney.ts
   │  └─ validators.ts
   └─ types/
      └─ api.ts
```

Notes:
- `pages/admin` contains the admin panel UI.
- `pages/store` contains the public website storefront + checkout.
- `api/` is a thin layer for calling the Node.js backend.

## Shared (`shared/`) (Optional but Useful)

```text
shared/
├─ package.json
└─ src/
   ├─ types/
   │  ├─ order.ts
   │  ├─ product.ts
   │  └─ payment.ts
   └─ schemas/
      ├─ order.schema.ts
      └─ product.schema.ts
```

Use `shared/` if you want to share TypeScript types/schemas between backend and frontend.

## Docs (`docs/`)

```text
docs/
├─ home-business-automation-prd.md
└─ home-business-automation-erd.md
```
