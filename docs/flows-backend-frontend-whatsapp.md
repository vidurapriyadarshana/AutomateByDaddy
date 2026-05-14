# Backend / Frontend / WhatsApp Flows (Separated)

This document separates the system into three views to make implementation and debugging easier.

## Backend Flow (API + DB + Jobs)

```mermaid
flowchart TD
  A[HTTP Request] --> B[Express Router]
  B --> C[Validation middleware (Zod)]
  C --> D[Controller]
  D --> E[Service]
  E --> F[Prisma (MySQL)]
  E --> G[Write AuditLog]
  E --> H[Enqueue jobs]
  H --> I[Worker sends Email]
  H --> J[Worker sends WhatsApp]

  F --> K[Response DTO]
  K --> L[HTTP Response]
```

Notes:
- `backend/src/main.ts` is responsible for env loading via `dotenv/config` and starting the server.
- Jobs/workers are for side effects (email/WhatsApp) so API requests stay fast.

## Frontend Flow (Website + Admin Panel)

```mermaid
sequenceDiagram
  participant U as User (Customer/Admin)
  participant FE as Frontend (Vite + React)
  participant API as Backend API
  participant DB as MySQL (Prisma)

  U->>FE: Load page
  FE->>API: GET /products
  API->>DB: Query products + variants
  DB-->>API: Results
  API-->>FE: JSON
  FE-->>U: Render list

  U->>FE: Checkout submit
  FE->>API: POST /checkout
  API->>DB: Create customer/address/order/payment
  API-->>FE: orderNumber + next steps
  FE-->>U: Confirmation UI
```

Notes:
- Admin Panel uses `/admin/*` endpoints and requires auth (implementation detail lives in backend plan).

## WhatsApp Flow (Inbound Webhook + Outbound Messages)

```mermaid
sequenceDiagram
  participant C as Customer
  participant WA as WhatsApp Provider
  participant API as Backend Webhook
  participant DB as MySQL (Prisma)
  participant Jobs as Jobs/Workers

  C->>WA: Send message (text/media)
  WA->>API: POST /webhooks/whatsapp (event)
  API->>DB: Persist Message + MessageThread
  API->>DB: (If order intent) create/update order draft
  API->>Jobs: Enqueue outbound reply
  Jobs->>WA: Send message
```

Notes:
- Provider-specific verification, templates, and message constraints are driven by PRD open questions.
