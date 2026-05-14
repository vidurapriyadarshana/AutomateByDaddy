# ER Diagram (MySQL)

```mermaid
erDiagram
  PRODUCT ||--o{ VARIANT : has
  CUSTOMER ||--o{ ADDRESS : saves
  CUSTOMER ||--o{ SALES_ORDER : places
  ADDRESS ||--o{ SALES_ORDER : used_for
  SALES_ORDER ||--|{ ORDER_ITEM : contains
  VARIANT ||--o{ ORDER_ITEM : ordered_as
  SALES_ORDER ||--o{ PAYMENT : has
  CUSTOMER ||--o{ MESSAGE_THREAD : chats_in
  MESSAGE_THREAD ||--|{ MESSAGE : contains
  MESSAGE_THREAD ||--o{ SALES_ORDER : sources
  ADMIN_USER ||--o{ AUDIT_LOG : performs
  SALES_ORDER ||--o{ AUDIT_LOG : logs
  PAYMENT ||--o{ AUDIT_LOG : logs

  PRODUCT {
    bigint id PK
    varchar name
    text description
    json images
    boolean active
    datetime created_at
    datetime updated_at
  }

  VARIANT {
    bigint id PK
    bigint product_id FK
    varchar sku "unique"
    varchar size
    varchar color
    decimal price
    int stock
    boolean active
    datetime created_at
    datetime updated_at
  }

  CUSTOMER {
    bigint id PK
    varchar full_name
    varchar phone_number "E.164 recommended"
    varchar email
    datetime created_at
    datetime updated_at
  }

  ADDRESS {
    bigint id PK
    bigint customer_id FK
    varchar line1
    varchar line2
    varchar city
    varchar district
    varchar postal_code
    varchar country
    varchar phone
    boolean is_default
    datetime created_at
    datetime updated_at
  }

  SALES_ORDER {
    bigint id PK
    varchar order_number "unique"
    bigint customer_id FK
    bigint address_id FK
    bigint message_thread_id FK "nullable"
    varchar channel "web|whatsapp"
    varchar status
    decimal subtotal
    decimal shipping_fee
    decimal total
    varchar currency
    text customer_note
    datetime created_at
    datetime updated_at
  }

  ORDER_ITEM {
    bigint id PK
    bigint order_id FK
    bigint variant_id FK
    int quantity
    decimal unit_price
    decimal line_total
  }

  PAYMENT {
    bigint id PK
    bigint order_id FK
    varchar method "cod|bank_transfer|gateway"
    varchar state "pending|review|verified|rejected|refunded"
    decimal amount
    varchar currency
    varchar slip_url "nullable"
    varchar gateway_ref "nullable"
    datetime created_at
    datetime updated_at
  }

  MESSAGE_THREAD {
    bigint id PK
    bigint customer_id FK
    varchar channel "whatsapp"
    varchar external_thread_id "provider conversation id"
    datetime last_message_at
    datetime created_at
  }

  MESSAGE {
    bigint id PK
    bigint thread_id FK
    varchar direction "in|out"
    text body
    varchar media_url "nullable"
    varchar provider_message_id "nullable"
    datetime created_at
  }

  ADMIN_USER {
    bigint id PK
    varchar email "unique"
    varchar password_hash
    varchar role "admin|staff"
    boolean active
    datetime created_at
    datetime updated_at
  }

  AUDIT_LOG {
    bigint id PK
    bigint actor_user_id FK "nullable (system actions)"
    bigint order_id FK "nullable"
    bigint payment_id FK "nullable"
    varchar action
    json meta
    datetime created_at
  }
```

## Entities (What Each One Does)

### PRODUCT
Represents a sellable product concept (e.g., "Oversized Hoodie"). Holds shared info like name, description, and photos.

Key fields:
- `active`: hide/show product.
- `images`: list of image URLs (can be JSON).

### VARIANT
Represents a specific purchasable option of a product (e.g., size M, color Black). This is what customers actually buy.

Key fields:
- `product_id`: connects the variant to its product.
- `sku`: unique code used for lookup from WhatsApp messages and internal tracking.
- `price`, `stock`: controls ordering and availability.

### CUSTOMER
Represents a buyer. Unifies website checkout and WhatsApp chat customers.

Key fields:
- `phone_number`: used to match inbound WhatsApp messages and website checkout.
- `email`: used for Gmail notifications.

### ADDRESS
Saved shipping/delivery addresses for a customer. Orders reference a specific address so historical orders remain correct even if the customer later edits their address.

For this project, the website checkout form includes: address, district, city, and postal code. Those map directly into this entity.

Key fields:
- `customer_id`: owner of the address.
- `is_default`: convenience for website checkout.

### SALES_ORDER
Represents a single order placed by a customer, from either WhatsApp or the website.

Key fields:
- `order_number`: human-friendly identifier shown in email/admin.
- `channel`: where the order originated (`web` or `whatsapp`).
- `status`: order lifecycle (e.g., `new`, `payment_review`, `confirmed`, `shipped`, `delivered`).
- `message_thread_id`: links to the WhatsApp conversation if the order came from chat.
- `subtotal`, `shipping_fee`, `total`, `currency`: totals used for payment and reporting.

### ORDER_ITEM
Line items inside an order. Each row is one variant + quantity.

Key fields:
- `variant_id`: what was sold.
- `unit_price`: price at time of purchase (important if prices change later).

### PAYMENT
Represents a payment attempt or payment record for an order.

Key fields:
- `method`: COD, bank transfer, or gateway.
- `state`: verification state (bank slips need manual approval, gateways can be auto-verified).
- `slip_url`: stored proof image for bank transfers.
- `gateway_ref`: payment provider reference for reconciliation.

### MESSAGE_THREAD
Represents a conversation with a customer on a channel (initially WhatsApp). Used to group messages and link chat-driven orders.

Key fields:
- `external_thread_id`: provider conversation ID (helps debugging and message sending).

### MESSAGE
Stores individual inbound and outbound messages (text and optional media). Useful for support, dispute handling, and tracking what the bot told the customer.

Key fields:
- `direction`: inbound from customer or outbound from system.
- `media_url`: WhatsApp images (e.g., payment slips) or other attachments.

### ADMIN_USER
Represents admin/staff users who log into the admin panel.

Key fields:
- `role`: authorization (admin vs staff).
- `password_hash`: store hashed password only.

### AUDIT_LOG
Records important changes for accountability (payment approvals, status changes, manual edits).

Key fields:
- `actor_user_id`: which admin/staff did it (nullable for automated/system actions).
- `order_id` / `payment_id`: links audit entries to the affected record.
- `action` + `meta`: what happened and details (old/new values).

## Relationships (Cardinality + Meaning)

### PRODUCT 1 to many VARIANT
One product can have many variants. A variant belongs to exactly one product.

Why:
- Clothing almost always has size/color combinations.
- Inventory and pricing are usually managed per variant.

### CUSTOMER 1 to many ADDRESS
One customer can save multiple addresses. Each address belongs to one customer.

Why:
- Customers may ship to home/work or different recipients.

### CUSTOMER 1 to many SALES_ORDER
One customer can place many orders. Each order belongs to one customer.

Why:
- Enables order history, repeat buyers, and unified identity across website + WhatsApp.

### ADDRESS 1 to many SALES_ORDER
An order uses exactly one address. The same address record can be reused by multiple orders.

Why:
- Preserves the shipping details used at checkout for that specific order.

### SALES_ORDER 1 to many ORDER_ITEM
An order contains one or more order items. Each order item belongs to exactly one order.

Why:
- Standard cart/checkout structure.

### VARIANT 1 to many ORDER_ITEM
A variant can appear in many order items over time. Each order item references one variant.

Why:
- Reports like “how many size M black hoodies sold” are based on variants.

### SALES_ORDER 1 to many PAYMENT (optional)
An order can have zero, one, or multiple payment records (for example: customer re-sends a slip, partial payment, or retries a gateway payment). Each payment belongs to one order.

Why:
- Real-world payments are messy; modeling retries avoids overwriting history.

### CUSTOMER 1 to many MESSAGE_THREAD
A customer can have multiple threads (usually one per WhatsApp number/channel). Each thread belongs to one customer.

Why:
- Keeps conversation history organized.

### MESSAGE_THREAD 1 to many MESSAGE
A thread contains many messages. Each message belongs to one thread.

Why:
- Needed for chat automation and later customer support.

### MESSAGE_THREAD 1 to many SALES_ORDER (optional)
A single WhatsApp thread can produce multiple orders over time. A website order may have no thread.

Why:
- Customers often reorder in the same chat.

### ADMIN_USER 1 to many AUDIT_LOG
An admin/staff user can create many audit log entries. Audit entries can also be system-generated with no actor user.

Why:
- Accountability and debugging.

### SALES_ORDER / PAYMENT 1 to many AUDIT_LOG (optional)
Orders and payments can have many audit events. Some events may only relate to an order, only to a payment, or to both.

Why:
- Track payment approvals, rejections, status changes, and corrections.

## Practical Constraints (Recommended)
- `VARIANT.sku` unique.
- `SALES_ORDER.order_number` unique.
- Consider a unique composite key for variants per product: (`product_id`, `size`, `color`) to prevent duplicates.
- Store money as `DECIMAL(10,2)` (or appropriate scale) and always store `currency`.
