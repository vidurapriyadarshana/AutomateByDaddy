# Home Business Automation (PRD)

## Overview
Build a lightweight omnichannel order + payment collection system for small home-based businesses (e.g., clothing brands) that sell via Facebook/website and finalize many orders in WhatsApp.

## Tech Stack
- Backend: Node.js
- Frontend: React (Vite)
- Database: MySQL

The system automates:
- Product inquiry replies in WhatsApp.
- Order confirmation and payment instructions.
- Collecting payment slip images.
- Creating orders in an admin panel.
- Sending email updates (Gmail) and WhatsApp status updates.
- Website checkout (COD, payment gateway, or bank transfer + slip upload) into the same admin panel.

## Problem
Home businesses lose time and sales because:
- Customers ask repetitive questions in WhatsApp (price, sizes, availability, delivery).
- Orders get missed in chat.
- Payment slips are hard to track.
- Order status updates are manual and inconsistent.

## Goals
1. Convert WhatsApp inquiries into tracked orders.
2. Centralize orders from WhatsApp and the website into one admin panel.
3. Reduce manual copy-paste by automating replies, payment instructions, and notifications.
4. Provide a clear order status pipeline from new to delivered.

## Non-Goals (Initial)
- Full accounting system.
- Advanced warehouse management.
- Multi-store marketplace.

## Users and Roles
- Customer: browses products, asks questions, places orders, submits payment proof, receives status updates.
  - Website customers do not need an account (guest checkout).
- Admin/Owner: manages products, pricing, inventory, orders, payments, and templates.
- Staff: processes orders and updates status (optional).

## Channels
1. WhatsApp
2. Website
3. Email (Gmail)
4. Optional later: Facebook/Instagram comments/DM

## Key Flows

### Flow A: WhatsApp Product Inquiry to Order
1. Customer sends a WhatsApp message containing product name/link/code.
2. Bot replies with product details:
   - Price
   - Available sizes/colors
   - Stock status
   - Delivery options and estimated delivery time
   - How to order
3. Customer confirms order details (variant, quantity, delivery info).
4. System asks for payment method:
   - Bank transfer
   - Payment link (gateway)
   - Cash on delivery (if allowed)
5. If bank transfer:
   - System sends bank details and amount.
   - Customer uploads payment slip image in WhatsApp.
   - System stores the slip and marks payment as "Pending verification".
6. Order is created automatically in admin panel with status "Pending payment" or "Payment review".
7. Admin verifies payment and sets status.
8. Customer receives:
   - WhatsApp status message.
   - Email (Gmail) confirmation and later status updates.

### Flow B: Website Checkout
1. Customer visits the website (no login), browses products, adds items to cart, and goes to checkout.
2. Checkout Step 1 (Customer + Delivery Details): customer fills a form with:
   - Name
   - Phone number
   - Email (Gmail)
   - Address
   - District
   - City
   - Postal code
3. Checkout Step 2 (Payment Method): customer chooses one:
   - Cash on delivery (COD)
   - Bank transfer
   - Card payment (payment gateway)
4. If COD:
   - Customer confirms the order.
   - Order is created with payment method `cod`.
5. If bank transfer:
   - System shows bank details and the amount.
   - Customer uploads the payment slip.
   - Customer confirms the order.
   - Order is created with payment state "Pending verification".
6. If card payment (gateway):
   - Customer completes payment via the gateway.
   - Payment is confirmed via webhook.
   - Order is created/updated as "Paid".
7. All website orders appear in admin panel.
8. Customer receives email updates and optional WhatsApp updates.

### Flow C: Order Processing and Status Updates
Admin/staff updates status:
- New
- Pending payment
- Payment review
- Confirmed
- Processing
- Shipped
- Delivered
- Cancelled
- Refunded

Each status change triggers:
- Email notification
- Optional WhatsApp message

## Admin Panel Requirements
### Orders
- Unified order list (WhatsApp + Website).
- Filters: status, payment state, date range, channel.
- Order details: items, customer info, shipping, notes, payment proof.
- Manual actions: approve/reject payment slip, change status, add tracking number, refund marker.
- Audit log: who changed what and when.

### Products
- Product CRUD: name, description, images, price.
- Variants: size, color.
- Inventory: stock per variant.
- Product codes or SKUs for WhatsApp lookup.

### Customers
- Customer profiles with:
  - Phone number (used for WhatsApp and delivery contact)
  - Email
  - Address history
  - Order history

### Messaging
- Template management for WhatsApp replies and email templates.
- Conversation thread view (optional MVP).

### Settings
- Business profile:
  - Bank details
  - COD rules
  - Delivery fees
  - Supported regions
- Integrations:
  - WhatsApp provider
  - Email provider
  - Payment gateway

## WhatsApp Automation Notes
WhatsApp automation requires WhatsApp Business Platform (Cloud API) or an approved provider (e.g., Twilio, 360dialog). Automating a normal personal WhatsApp number is not supported and can lead to bans.

Important WhatsApp constraints:
- Message templates are required for outbound messages outside the 24-hour customer care window.
- Media (payment slips) arrives as an attachment URL/media ID that must be downloaded and stored.

## Payment Slip Handling
MVP:
- Store slip image.
- Allow admin to approve/reject.

Optional later:
- OCR extraction (amount, reference number, date) to assist verification.

## Data Model (High-Level)
- Product(id, name, description, images, active)
- Variant(id, productId, size, color, sku, price, stock)
- Customer(id, name, phoneNumber, email)
- Address(id, customerId, address, district, city, postalCode)
- Order(id, channel, customerId, status, total, addressId, createdAt)
- OrderItem(id, orderId, variantId, quantity, unitPrice)
- Payment(id, orderId, method, state, amount, slipUrl, gatewayRef)
- MessageThread(id, customerId, channel)
- Message(id, threadId, direction, text, mediaUrl, createdAt)
- AuditLog(id, actorId, action, entityType, entityId, createdAt)

## APIs and Integrations
- WhatsApp: inbound webhook for messages and media; outbound send message.
- Website: checkout API, order API.
- Payment gateway: create payment link and receive webhook confirmations.
- Email: SMTP or provider API for Gmail-compatible sending.

## Permissions
- Admin: full access.
- Staff: orders and status updates; no integration settings.

## Non-Functional Requirements
- Security:
  - Encrypted secrets (API keys).
  - Auth with strong passwords and optional 2FA.
  - Role-based access.
- Reliability:
  - Webhook retry handling and idempotency (avoid duplicate orders).
- Privacy:
  - Limit access to customer PII.
  - Data export/delete for customer requests (later).
- Performance:
  - Admin order list loads quickly for 1k-10k orders.

## MVP Scope (Suggested)
1. Product catalog with variants and stock.
2. Website checkout: COD + bank transfer slip upload.
3. Admin panel: unified orders, payment slip review, status updates.
4. Email notifications on order confirmation and status changes.
5. WhatsApp bot:
   - Product lookup by code/link.
   - Capture order details.
   - Collect bank transfer slip.
   - Create order in admin.

## Open Questions
1. Country/region and currency.
2. Delivery provider integration needed (tracking) or manual only.
3. Preferred payment gateway (Stripe, PayPal, local bank, etc.).
4. Do you want WhatsApp to be the main ordering channel, or only support inquiries.
5. How many products and daily orders (scale estimate).
