/**
 * Phase 5: Checkout + Orders Testing Guide
 *
 * Prerequisites:
 * 1. Backend must be running: npm run dev
 * 2. MySQL database must be accessible
 * 3. Products and variants must be created (Phase 3)
 * 4. Admin user must exist (Phase 2) for admin endpoints
 *
 * ============ PUBLIC CHECKOUT FLOW ============
 *
 * 1. POST /checkout
 *    Public endpoint - create order from customer details
 *
 *    Request:
 *    {
 *      "fullName": "John Doe",
 *      "phone": "+94771234567",
 *      "email": "john@example.com",
 *      "addressLine1": "123 Main Street",
 *      "addressLine2": "Apt 4B",
 *      "city": "Colombo",
 *      "district": "Western Province",
 *      "postalCode": "00100",
 *      "country": "Sri Lanka",
 *      "deliveryPhone": "+94771234567",
 *      "items": [
 *        {
 *          "variantId": "1",
 *          "quantity": 2
 *        },
 *        {
 *          "variantId": "2",
 *          "quantity": 1
 *        }
 *      ],
 *      "paymentMethod": "cod",
 *      "notes": "Please deliver after 5 PM"
 *    }
 *
 *    Notes:
 *    - variantId can be obtained from GET /products/:id (variants array)
 *    - paymentMethod: "cod" (Cash on Delivery) or "bank_transfer"
 *    - If bank_transfer, must include bankTransferSlipUrl
 *    - Shipping fee is fixed at 250.00 LKR for MVP
 *    - Currency is always LKR
 *    - Order status depends on payment method:
 *      - COD: pending_payment (admin confirms)
 *      - Bank transfer with slip: payment_review (admin verifies slip)
 *      - Bank transfer without slip: new (customer submits slip later)
 *
 *    Response: 201 Created
 *    {
 *      "orderNumber": "ORD-20260515-AB12C",
 *      "id": "100",
 *      "customerId": "50",
 *      "status": "pending_payment",
 *      "subtotal": "7000.00",
 *      "shippingFee": "250.00",
 *      "total": "7250.00",
 *      "paymentMethod": "cod",
 *      "message": "Order created. Awaiting payment confirmation."
 *    }
 *
 * 2. POST /orders/lookup
 *    Public order status lookup with phone verification
 *
 *    Request:
 *    {
 *      "orderNumber": "ORD-20260515-AB12C",
 *      "phone": "+94771234567"
 *    }
 *
 *    Response: 200 OK
 *    {
 *      "orderNumber": "ORD-20260515-AB12C",
 *      "status": "confirmed",
 *      "total": "7250.00",
 *      "createdAt": "2026-05-15T10:30:00Z",
 *      "customerName": "John Doe"
 *    }
 *
 *    Error if phone doesn't match:
 *    {
 *      "error": {
 *        "message": "Phone number does not match order",
 *        "code": "FORBIDDEN"
 *      }
 *    }
 *
 * 3. GET /orders/:orderNumber
 *    Public get order (limited info, no verification needed)
 *
 *    Request:
 *    GET http://localhost:4000/orders/ORD-20260515-AB12C
 *
 *    Response: 200 OK
 *    {
 *      "orderNumber": "ORD-20260515-AB12C",
 *      "status": "confirmed",
 *      "total": "7250.00",
 *      "createdAt": "2026-05-15T10:30:00Z"
 *    }
 *
 * ============ ADMIN ORDER ENDPOINTS ============
 *
 * 4. GET /admin/orders
 *    List all orders with optional filtering
 *
 *    Query parameters:
 *    - page: Page number (default: 1)
 *    - pageSize: Items per page (default: 20, max: 100)
 *    - status: Filter by status (e.g., "confirmed", "processing")
 *    - channel: Filter by channel ("web" or "whatsapp")
 *
 *    Request:
 *    GET http://localhost:4000/admin/orders?page=1&pageSize=20&status=pending_payment
 *    Authorization: Bearer <JWT_TOKEN>
 *
 *    Response: 200 OK
 *    {
 *      "items": [
 *        {
 *          "id": "100",
 *          "orderNumber": "ORD-20260515-AB12C",
 *          "customerId": "50",
 *          "addressId": "75",
 *          "channel": "web",
 *          "status": "pending_payment",
 *          "subtotal": "7000.00",
 *          "shippingFee": "250.00",
 *          "total": "7250.00",
 *          "currency": "LKR",
 *          "customerNote": "Please deliver after 5 PM",
 *          "createdAt": "2026-05-15T...",
 *          "updatedAt": "2026-05-15T...",
 *          "customer": {
 *            "fullName": "John Doe",
 *            "phone": "+94771234567"
 *          }
 *        }
 *      ],
 *      "total": 42,
 *      "page": 1,
 *      "pageSize": 20,
 *      "totalPages": 3
 *    }
 *
 * 5. GET /admin/orders/:id
 *    Get full order details (admin view)
 *
 *    Request:
 *    GET http://localhost:4000/admin/orders/100
 *    Authorization: Bearer <JWT_TOKEN>
 *
 *    Response: 200 OK
 *    {
 *      "id": "100",
 *      "orderNumber": "ORD-20260515-AB12C",
 *      "customerId": "50",
 *      "addressId": "75",
 *      "channel": "web",
 *      "status": "pending_payment",
 *      "subtotal": "7000.00",
 *      "shippingFee": "250.00",
 *      "total": "7250.00",
 *      "currency": "LKR",
 *      "customerNote": "Please deliver after 5 PM",
 *      "createdAt": "2026-05-15T...",
 *      "updatedAt": "2026-05-15T...",
 *      "customer": {
 *        "id": "50",
 *        "fullName": "John Doe",
 *        "phone": "+94771234567",
 *        "email": "john@example.com"
 *      },
 *      "address": {
 *        "id": "75",
 *        "line1": "123 Main Street",
 *        "line2": "Apt 4B",
 *        "city": "Colombo",
 *        "district": "Western Province",
 *        "postalCode": "00100",
 *        "country": "Sri Lanka",
 *        "phone": "+94771234567"
 *      },
 *      "items": [
 *        {
 *          "id": "200",
 *          "orderId": "100",
 *          "variantId": "1",
 *          "quantity": 2,
 *          "unitPrice": "3500.00",
 *          "lineTotal": "7000.00"
 *        }
 *      ],
 *      "payments": [
 *        {
 *          "id": "300",
 *          "method": "cod",
 *          "state": "pending",
 *          "amount": "7250.00",
 *          "slipUrl": null,
 *          "createdAt": "2026-05-15T..."
 *        }
 *      ]
 *    }
 *
 * 6. PATCH /admin/orders/:id/status
 *    Update order status with validation
 *
 *    Request:
 *    {
 *      "status": "confirmed",
 *      "notes": "Payment received, confirmed by admin"
 *    }
 *
 *    Valid status transitions:
 *    - new -> pending_payment, cancelled
 *    - pending_payment -> payment_review, cancelled
 *    - payment_review -> confirmed, rejected, cancelled
 *    - confirmed -> processing, cancelled
 *    - processing -> shipped, cancelled
 *    - shipped -> delivered, cancelled
 *    - delivered -> refunded
 *    - cancelled -> (no transitions)
 *    - refunded -> (no transitions)
 *
 *    Response: 200 OK
 *    {
 *      "id": "100",
 *      "orderNumber": "ORD-20260515-AB12C",
 *      "status": "confirmed",
 *      "message": "Order status updated to confirmed"
 *    }
 *
 *    Error if invalid transition:
 *    {
 *      "error": {
 *        "message": "Cannot transition from pending_payment to delivered",
 *        "code": "INVALID_TRANSITION"
 *      }
 *    }
 *
 * 7. POST /admin/orders/:id/notes
 *    Add note to order (internal use)
 *
 *    Request:
 *    {
 *      "note": "Customer called, confirmed address"
 *    }
 *
 *    Response: 200 OK
 *    {
 *      "message": "Note added",
 *      "id": "100"
 *    }
 *
 * ============ CHECKOUT ERROR CASES ============
 *
 * - Missing required fields:
 *   Response: 400 Validation error
 *
 * - Variant not found:
 *   POST /checkout with variantId "99999"
 *   Response: 500 "Variant 99999 not found"
 *
 * - Insufficient stock:
 *   Response: 409 "Insufficient stock for variant SHIRT-BLK-M. Available: check inventory"
 *
 * - Inactive variant:
 *   Response: 400 "Variant X is inactive"
 *
 * - Invalid payment method:
 *   Response: 400 Validation error
 *
 * - Bank transfer without slip:
 *   Response: 400 Validation error (bankTransferSlipUrl required)
 *
 * ============ ADMIN ERROR CASES ============
 *
 * - Missing auth token:
 *   Response: 401 "Missing or invalid authentication token"
 *
 * - Non-admin user:
 *   Response: 403 "Insufficient permissions"
 *
 * - Order not found:
 *   GET /admin/orders/99999
 *   Response: 404 "Order not found"
 *
 * - Invalid pagination:
 *   GET /admin/orders?pageSize=101
 *   Response: 400 Validation error
 *
 * ============ ORDER NUMBERING ============
 *
 * Order numbers are generated in format: ORD-YYYYMMDD-XXXXX
 * - ORD: Prefix for orders
 * - YYYYMMDD: Date (e.g., 20260515)
 * - XXXXX: 5 random alphanumeric chars
 * - Example: ORD-20260515-AB12C
 *
 * Order numbers are:
 * - Unique (never duplicate)
 * - Human-friendly (easy to read in emails/messages)
 * - Non-sequential (prevents guessing next order number)
 * - Verification: Must match customer phone for status lookup
 *
 * ============ AUDIT LOGGING ============
 *
 * Admin actions are logged to AuditLog table:
 * - order_status_updated (when status changes)
 * - order_note_added (when note is added)
 *
 * Query audit logs from database:
 *   SELECT * FROM AuditLog WHERE action LIKE 'order%' ORDER BY createdAt DESC;
 *
 * ============ WORKFLOW EXAMPLE ============
 *
 * 1. Customer browses products:
 *    GET /products
 *    GET /products/1 (get variants)
 *
 * 2. Customer checks stock by SKU:
 *    GET /variants/sku/SHIRT-BLK-M
 *
 * 3. Customer submits checkout:
 *    POST /checkout with items and payment method
 *
 * 4. Customer gets order number:
 *    Response includes orderNumber (e.g., ORD-20260515-AB12C)
 *
 * 5. Customer checks order status:
 *    POST /orders/lookup (with phone verification)
 *    or GET /orders/ORD-20260515-AB12C (public)
 *
 * 6. Admin receives order and processes it:
 *    GET /admin/orders (see pending orders)
 *    GET /admin/orders/100 (view full details)
 *    PATCH /admin/orders/100/status -> "confirmed"
 *    PATCH /admin/orders/100/status -> "processing"
 *    PATCH /admin/orders/100/status -> "shipped"
 *    PATCH /admin/orders/100/status -> "delivered"
 *
 * ============ PHASE 5 INTEGRATION ============
 *
 * Phase 5 uses:
 * - Customer service: getOrCreateCustomer(), createAddress()
 * - Product service: getVariantById(), checkAndReserveStock()
 * - Audit utilities: auditAction()
 * - Money utilities: addPrices(), multiplyPrice(), formatDecimal()
 * - Pagination utilities: getPaginationParams(), buildPaginatedResponse()
 *
 * Phase 6 (Payments + Slip Upload) will:
 * - Handle payment verification
 * - Process bank transfer slips
 * - Update payment status
 * - Trigger order status changes based on payment state
 */
