# Frontend Implementation Plan

Maps every feature in the backend API to a frontend implementation phase.

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | React 19 + Vite + TypeScript (already set up) |
| Routing | React Router v7 |
| HTTP | Axios (interceptors for auth, error normalization) |
| State | Zustand (persist middleware for auth + cart) |
| UI | Shadcn + Tailwind CSS v4 |
| Forms | React Hook Form + Zod |
| Icons | Lucide React |
| Charts | Recharts (analytics page) |
| Build | `tsc -b && vite build` (already configured) |

## Folder Structure

```
frontend/src/
├── api/                    # Axios instance + endpoint modules
│   ├── client.ts           #   base URL, auth interceptor, 401 redirect
│   ├── auth.ts
│   ├── products.ts
│   ├── customers.ts
│   ├── orders.ts
│   ├── payments.ts
│   └── whatsapp.ts
├── store/                  # Zustand stores (persisted)
│   ├── auth.ts             #   token, user, login(), logout(), hydrate()
│   ├── cart.ts             #   items, addItem(), removeItem(), total()
│   └── ui.ts               #   sidebar, toast queue
├── types/                  # DTOs mirroring backend JSON responses
│   ├── api.ts              #   ApiErrorBody, PaginatedResponse<T>
│   ├── auth.ts             #   AuthResponse, UserResponse
│   ├── product.ts          #   ProductResponse, VariantResponse
│   ├── customer.ts         #   CustomerResponse, AddressResponse
│   ├── order.ts            #   OrderResponse, OrderDetailResponse, CheckoutRequest
│   ├── payment.ts          #   PaymentResponse, SlipUploadResponse
│   └── whatsapp.ts         #   ThreadResponse, ChatMessage
├── hooks/                  # Custom React hooks
│   ├── useProducts.ts
│   ├── useOrders.ts
│   ├── useThreads.ts
│   └── useAnalytics.ts
├── components/
│   ├── ui/                 # Shadcn primitives
│   ├── Layout/
│   │   ├── AppLayout.tsx   #   public layout (header, footer)
│   │   ├── AdminLayout.tsx #   sidebar + navbar + <Outlet/>
│   │   ├── Sidebar.tsx
│   │   └── PrivateRoute.tsx
│   ├── products/           # ProductCard, VariantPicker, etc.
│   ├── orders/             # OrderStatusBadge, StatusTimeline, etc.
│   └── payments/           # SlipPreview, PaymentActions, etc.
├── pages/
│   ├── Login.tsx
│   ├── public/
│   │   ├── Home.tsx
│   │   ├── ProductDetail.tsx
│   │   ├── Checkout.tsx
│   │   ├── OrderConfirmation.tsx
│   │   ├── OrderLookup.tsx
│   │   └── OrderStatus.tsx
│   └── admin/
│       ├── Dashboard.tsx
│       ├── products/
│       │   ├── ProductList.tsx
│       │   ├── ProductForm.tsx
│       │   └── VariantList.tsx
│       ├── customers/
│       │   ├── CustomerList.tsx
│       │   └── CustomerDetail.tsx
│       ├── orders/
│       │   ├── OrderList.tsx
│       │   └── OrderDetail.tsx
│       ├── payments/
│       │   ├── PaymentList.tsx
│       │   └── PaymentReview.tsx
│       ├── whatsapp/
│       │   ├── WhatsAppSetup.tsx
│       │   └── WhatsAppChat.tsx
│       └── analytics/
│           └── Analytics.tsx
├── App.tsx                 # Route definitions
└── main.tsx
```

---

## Phase 1: Foundation

**Install deps:**
```bash
npm install axios zustand react-router-dom react-hook-form @hookform/resolvers zod lucide-react
npx shadcn@latest init
npx shadcn@latest add button input table dialog select badge card separator toast avatar sheet
```

**Vite proxy** (`vite.config.ts`):
```ts
server: { proxy: { "/api": "http://localhost:4000" } }
```
`VITE_API_URL` env var for produciton builds.

**Deliverables:**
- `api/client.ts` — Axios instance with auth request interceptor + 401 response interceptor
- `types/api.ts` — `ApiErrorBody`, `PaginatedResponse<T>`
- `store/ui.ts` — sidebar open/closed, toast notifications

---

## Phase 2: Auth + Layout

Backend endpoints: `POST /auth/login` · `GET /auth/me`

**Files:**

| File | What it does |
|------|-------------|
| `types/auth.ts` | `AuthResponse { accessToken, user }` · `UserResponse { id, email, role, active }` |
| `api/auth.ts` | `login(email, password)`, `getMe()` |
| `store/auth.ts` | Zustand + persist. `login()` calls API → saves token+user. `hydrate()` validates stored token on mount. `logout()` clears all. |
| `pages/Login.tsx` | Email + password form. Shadcn `Card`, `Input`, `Button`. Zod validation. On success → `/admin`. Errors from `ApiErrorBody`. |
| `components/Layout/PrivateRoute.tsx` | Reads `authStore.isAuthenticated`. Redirects to `/login` if absent. |
| `components/Layout/AppLayout.tsx` | Public layout: header (logo, nav: Home, Order Lookup), `<Outlet/>`, footer. |
| `components/Layout/AdminLayout.tsx` | Sidebar + top navbar + `<Outlet/>`. Sidebar groups: **Management** (Products, Customers, Orders), **Finance** (Payments), **Communication** (WhatsApp Chats, WhatsApp Settings), **Insights** (Dashboard, Analytics). Active route highlighted. Collapsible on mobile via Zustand `ui.sidebarOpen`. |
| `App.tsx` | Route tree wired with `BrowserRouter`. All routes defined here. `authStore.hydrate()` called once on mount. |

**Routes added:**
```
/login          → pages/Login.tsx
/               → AppLayout > public/Home.tsx
/admin          → AdminLayout > admin/Dashboard.tsx  (private)
/admin/*        → AdminLayout > rest of admin pages   (private)
```

---

## Phase 3: Public Product Pages

Backend endpoints: `GET /products?page=...&pageSize=...` · `GET /products/:id`

**Files:**

| File | What it does |
|------|-------------|
| `types/product.ts` | `ProductResponse { id, name, description?, images?, active, _count }` · `VariantResponse { id, productId, sku, size, color, price, stock, active }` |
| `api/products.ts` | `listProducts(page, pageSize)`, `getProduct(id)`, `getVariantBySku(sku)` |
| `services/cart.ts` | `computeTotal()`, `computeItemCount()` helpers for cart store |
| `store/cart.ts` | Zustand + persist. `items: CartItem[]`. Actions: `addItem`, `removeItem`, `updateQuantity`, `clearCart`. Computed: `total`, `itemCount`. |
| `pages/public/Home.tsx` | Fetch `listProducts(1, 20)`. Grid of product cards (image, name, "View Details"). Pagination at bottom. Search/filter bar (future: category filter). |
| `pages/public/ProductDetail.tsx` | Fetch `getProduct(id)`. Name, description, images gallery. Variant picker: color swatches → size buttons → stock indicator + price. "Add to Cart" button. |

---

## Phase 4: Checkout + Public Order Lookup

Backend endpoints: `POST /checkout` · `GET /orders/:orderNumber` · `POST /orders/lookup` · `POST /payments/slip?orderId=...`

**Files:**

| File | What it does |
|------|-------------|
| `types/order.ts` | `CheckoutRequest`, `CheckoutResponse { orderNumber, id, status, subtotal, shippingFee, total, paymentMethod }`, `PublicOrderResponse { orderNumber, status, total, createdAt, customerName }` |
| `api/orders.ts` | `checkout(data)`, `getOrderByNumber(orderNumber)`, `lookupOrder(orderNumber, phone)` |
| `api/payments.ts` | `uploadSlip(orderId, file)` — multipart/form-data via Axios `FormData` |
| `pages/public/Checkout.tsx` | Multi-section form on one scrollable page:
  1. **Customer**: fullName, phone, email
  2. **Delivery**: line1, line2, city, district, postalCode, country, deliveryPhone
  3. **Items** (read-only from cart): variant label, qty, unit price, line total
  4. **Payment**: radio COD / Bank Transfer. If bank transfer: file input for slip (JPEG/PNG/WebP/PDF, max 5MB, preview)
  5. **Notes**: optional textarea
  6. Submit → `POST /checkout`. If bank transfer → `POST /payments/slip?orderId=...`. On success → redirect to `/order/:orderNumber`. |
| `pages/public/OrderConfirmation.tsx` | "Thank you" page. Shows order number, status, total. Instructions for next steps (if bank transfer: upload slip if not done). Link to `/order/lookup`. |
| `pages/public/OrderLookup.tsx` | Form: orderNumber + phone. Submit → `POST /orders/lookup`. Shows result card with status badge, total, customer name. |
| `pages/public/OrderStatus.tsx` | URL param `:orderNumber`. Fetches `GET /orders/:orderNumber`. Status timeline visualization (stepper: New → Pending Payment → Confirmed → Shipped → Delivered). |

---

## Phase 5: Admin Products

Backend endpoints:
- `GET /products/admin/products?page=...` · `POST /products/admin/products`
- `PATCH /products/admin/products/:id` · `DELETE /products/admin/products/:id`
- `GET /products/admin/products/:productId/variants` · `POST /products/admin/products/:productId/variants`
- `PATCH /products/admin/variants/:id`

**Files:**

| File | What it does |
|------|-------------|
| `pages/admin/products/ProductList.tsx` | Table: name, active badge, variant count, actions (edit, deactivate). Pagination. "Add Product" button. |
| `pages/admin/products/ProductForm.tsx` | Create/Edit form. Fields: name (required), description, images (URL array, add/remove), active toggle. Zod validation. On submit → POST or PATCH. On success → redirect to product list. |
| `pages/admin/products/VariantList.tsx` | Nested under product. Table: SKU, size, color, price (formatted), stock, active. "Add Variant" opens modal with SKU, size, color, price, stock. Each row has edit button that opens same modal filled. |

---

## Phase 6: Admin Customers

Backend endpoints:
- `GET /admin/customers?page=...&search=...` · `GET /admin/customers/:id`
- `GET /admin/customers/:customerId/addresses` · `POST /admin/customers/:customerId/addresses`
- `PATCH /admin/customers/:customerId/addresses/:addressId` · `DELETE /admin/customers/:customerId/addresses/:addressId`

**Files:**

| File | What it does |
|------|-------------|
| `types/customer.ts` | `CustomerResponse`, `AddressResponse` |
| `api/customers.ts` | `listCustomers(page, search)`, `getCustomer(id)`, `createAddress(customerId, data)`, `updateAddress(...)`, `deleteAddress(...)` |
| `pages/admin/customers/CustomerList.tsx` | Search input (debounced, queries name/phone/email). Table: name, phone, email, order count, created date. Pagination. |
| `pages/admin/customers/CustomerDetail.tsx` | Info card (name, phone, email). Addresses section: list with inline edit/delete, "Add Address" form. Recent orders section. |

---

## Phase 7: Admin Orders

Backend endpoints:
- `GET /orders/?page=...&status=...&channel=...` · `GET /orders/:id`
- `PATCH /orders/:id/status` · `POST /orders/:id/notes`

**Files:**

| File | What it does |
|------|-------------|
| `api/orders.ts` | Plus: `listOrders(page, filters)`, `getOrder(id)`, `updateOrderStatus(id, status, notes?)`, `addOrderNote(id, note)` |
| `pages/admin/orders/OrderList.tsx` | Filter bar: status dropdown, channel (web/whatsapp) chips. Table: order number, customer name, status (colored Shadcn `Badge`), total, channel icon, date. Click row → detail. |
| `pages/admin/orders/OrderDetail.tsx` | Sections:
  1. **Customer**: name, phone, email
  2. **Delivery**: full address
  3. **Items**: table (variant, SKU, size/color, qty, unitPrice, lineTotal). Total row at bottom (subtotal + shipping = total).
  4. **Payments**: method, state badge, slip thumbnail (click to enlarge), gateway ref.
  5. **Status**: current status badge, dropdown to change (with confirmation dialog) → calls patch `/status`.
  6. **Notes**: list of audit log notes, textarea to add new → calls `POST /notes`. |

---

## Phase 8: Admin Payments

Backend endpoints:
- `GET /admin/payments/:id` · `POST /admin/payments/:id/verify` · `POST /admin/payments/:id/reject`

**Files:**

| File | What it does |
|------|-------------|
| `types/payment.ts` | `PaymentResponse { id, orderId, method, state, amount, slipUrl, createdAt }`, `PaymentActionResponse` |
| `api/payments.ts` | `getPayment(id)`, `verifyPayment(id, notes?)`, `rejectPayment(id, reason)` |
| `pages/admin/payments/PaymentList.tsx` | Fetch payments (sorted by newest, filterable by state). Table: order number, amount, method, state badge, date. Click → detail. |
| `pages/admin/payments/PaymentReview.tsx` | Order info card. Slip image display (Shadcn `Dialog` for full-size). Actions: **Verify** button (optional notes) → `POST verify`. **Reject** button → modal with reason textarea → `POST reject`. Confirmation before each. Toast on success. |

---

## Phase 9: WhatsApp

Backend endpoints:
- `GET /webhooks/whatsapp/status` · `GET /webhooks/whatsapp/qr`
- `POST /webhooks/whatsapp/logout` · `POST /webhooks/whatsapp/reinit`
- `GET /admin/whatsapp/threads?page=...` · `GET /admin/whatsapp/threads/:id/messages?page=...`
- `POST /admin/whatsapp/threads/:id/send`

**Files:**

| File | What it does |
|------|-------------|
| `types/whatsapp.ts` | `ThreadListItem { id, customerId, customerName, customerPhone, lastMessage?, channel, updatedAt }` · `ChatMessage { id, direction, body, mediaUrl, createdAt }` |
| `api/whatsapp.ts` | `getStatus()`, `getQR()`, `logout()`, `reinit()`, `listThreads(page)`, `getThreadMessages(threadId, page)`, `sendMessage(threadId, text)` |
| `hooks/useThreads.ts` | Polls `listThreads` every 10s. Returns threads array + unread count. |
| `pages/admin/whatsapp/WhatsAppSetup.tsx` | Status indicator (green dot + "Connected" / red + "Disconnected"). If disconnected: QR code image from `GET /webhooks/whatsapp/qr`. Auto-refresh status every 5s while initializing. Buttons: Disconnect, Reinitialize. |
| `pages/admin/whatsapp/WhatsAppChat.tsx` | Split layout:
  - **Left** (`ConversationList`): Threads from `useThreads`. Each row: customer name, phone, last message preview (~50 chars), relative timestamp. Active thread highlighted. Search box to filter by name/phone. Unread count badge.
  - **Right** (`ChatPanel`): Header (name, phone). Message list: speech bubbles (sent right/aligned right, received left/aligned left). Timestamps (HH:MM). Auto-scroll to bottom. Input bar: textarea (Enter send, Shift+Enter newline) + Send button. Polls for new messages every 5s on active thread. |

---

## Phase 10: Dashboard & Analytics

Backend endpoints (need to be added):
- `GET /admin/analytics/summary` · `GET /admin/analytics/orders-over-time?from=...&to=...`
- `GET /admin/analytics/top-products` · `GET /admin/analytics/whatsapp-activity`

**Install:** `npm install recharts`

**Files:**

| File | What it does |
|------|-------------|
| `pages/admin/Dashboard.tsx` | KPI card row (Shadcn `Card`): orders today, pending payments, new customers this week, revenue this month. Recent orders table (last 10). Quick action buttons. |
| `pages/admin/analytics/Analytics.tsx` | Date range picker (7d/30d/90d/custom). Sections:
  1. **Orders Over Time** — Recharts `LineChart` or `BarChart`. X: date, Y: count + revenue.
  2. **Top Products** — table: rank, product name, variant (size/color), qty sold, revenue.
  3. **WhatsApp Activity** — stacked bar chart: sent vs received per day.
  4. **Export CSV** button (future). |

---

## API Integration Details

### Axios Client (`api/client.ts`)

```ts
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL ?? "/api" });

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) useAuthStore.getState().logout();
    return Promise.reject(err);
  },
);
```

### Auth Token

- Zustand `auth` store with `persist` middleware → auto-synced to `localStorage`
- On mount: `authStore.hydrate()` calls `GET /auth/me` to validate stored token
- 401 interceptor → `authStore.logout()` → redirect `/login`

### File Upload

```ts
const form = new FormData();
form.append("slip", file);
await api.post(`/payments/slip?orderId=${orderId}`, form);
```
- Allowed: image/jpeg, image/png, image/webp, application/pdf
- Max 5MB (enforced by backend)

### Error Handling

- Axios interceptor normalizes errors → `{ status, data: { error: { message, code, details? } } }`
- React Hook Form shows field-level Zod errors
- Shadcn Toast for success/failure notifications via Zustand `ui` store
- React Error Boundary catches render crashes

---

## Route Map (Complete)

### Public
| Path | Component | Auth |
|------|-----------|------|
| `/` | `Home.tsx` | No |
| `/products/:id` | `ProductDetail.tsx` | No |
| `/checkout` | `Checkout.tsx` | No |
| `/order/:orderNumber` | `OrderStatus.tsx` | No |
| `/order/lookup` | `OrderLookup.tsx` | No |
| `/login` | `Login.tsx` | No |

### Admin (all under `PrivateRoute`)
| Path | Component |
|------|-----------|
| `/admin` | `Dashboard.tsx` |
| `/admin/products` | `ProductList.tsx` |
| `/admin/products/new` | `ProductForm.tsx` (create) |
| `/admin/products/:id/edit` | `ProductForm.tsx` (edit) |
| `/admin/products/:id/variants` | `VariantList.tsx` |
| `/admin/customers` | `CustomerList.tsx` |
| `/admin/customers/:id` | `CustomerDetail.tsx` |
| `/admin/orders` | `OrderList.tsx` |
| `/admin/orders/:id` | `OrderDetail.tsx` |
| `/admin/payments` | `PaymentList.tsx` |
| `/admin/payments/:id` | `PaymentReview.tsx` |
| `/admin/whatsapp` | `WhatsAppSetup.tsx` |
| `/admin/whatsapp/chat` | `WhatsAppChat.tsx` |
| `/admin/analytics` | `Analytics.tsx` |

---

## Frontend ↔ Backend Coverage Matrix

| Backend Feature | Frontend Phase | Status |
|----------------|---------------|--------|
| `POST /auth/login` · `GET /auth/me` | Phase 2 | Not started |
| `GET /products` · `GET /products/:id` | Phase 3 | Not started |
| `GET /products/admin/products` · POST · PATCH · DELETE | Phase 5 | Not started |
| `GET /products/admin/products/:id/variants` · POST · PATCH | Phase 5 | Not started |
| `GET /admin/customers` · `GET /admin/customers/:id` | Phase 6 | Not started |
| Addresses CRUD | Phase 6 | Not started |
| `POST /checkout` | Phase 4 | Not started |
| `GET /orders/:orderNumber` · `POST /orders/lookup` | Phase 4 | Not started |
| `GET /orders/` · `GET /orders/:id` | Phase 7 | Not started |
| `PATCH /orders/:id/status` · `POST /orders/:id/notes` | Phase 7 | Not started |
| `POST /payments/slip` | Phase 4 | Not started |
| `GET /admin/payments/:id` · verify · reject | Phase 8 | Not started |
| WhatsApp status · QR · logout · reinit | Phase 9 | Not started |
| WhatsApp threads · messages · send | Phase 9 | Not started |
| Dashboard + Analytics endpoints | Phase 10 | Not started |
