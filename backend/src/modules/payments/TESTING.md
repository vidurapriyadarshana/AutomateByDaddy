# Phase 6: Payments + Slip Upload - Testing Guide

This guide provides practical examples for testing Phase 6 payment endpoints.

## Prerequisites

- Backend running on `http://localhost:4000`
- Admin JWT token from `/auth/login` (required for admin endpoints)
- Test order created via checkout (`POST /checkout`)
- Payment slip image file (JPG, PNG, or WebP, max 5MB)

## Assumptions

- Admin user exists with email `admin@example.com` and password `SecurePassword123!`
- An order has been created with ID and is in appropriate status
- Uploaded files will be stored in `backend/uploads/slips/`

## Workflow: Bank Transfer Payment with Slip Upload

### Step 1: Create an Order (with or without slip)

**POST /checkout**

```bash
curl -X POST http://localhost:4000/checkout \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "phone": "+94701234567",
    "email": "john@example.com",
    "addressLine1": "123 Main St",
    "addressLine2": "Apt 4B",
    "city": "Colombo",
    "district": "Western",
    "postalCode": "00600",
    "country": "Sri Lanka",
    "deliveryPhone": "+94701234567",
    "items": [
      {
        "variantId": "1",
        "quantity": 2
      }
    ],
    "paymentMethod": "bank_transfer",
    "notes": "Please deliver in the morning"
  }'
```

**Expected Response:**

```json
{
  "orderNumber": "ORD-20260515-ABC12",
  "id": 5,
  "customerId": 3,
  "status": "pending_payment",
  "subtotal": "5000.00",
  "shippingFee": "250.00",
  "total": "5250.00",
  "paymentMethod": "bank_transfer",
  "message": "Order created successfully. Please upload payment slip."
}
```

### Step 2: Upload Payment Slip

**POST /payments/slip?orderId=5**

```bash
curl -X POST http://localhost:4000/payments/slip?orderId=5 \
  -F "slip=@/path/to/payment-slip.jpg"
```

**Notes:**
- Upload a valid image file (JPEG, PNG, WebP, or PDF)
- Max file size: 5 MB
- `orderId` is required as query parameter
- File is saved to disk and accessible at returned `slipUrl`

**Expected Response:**

```json
{
  "paymentId": 8,
  "slipUrl": "/uploads/slips/payment-8-a1b2c3d4e5f6g7h8.jpg",
  "state": "review",
  "message": "Payment slip uploaded successfully"
}
```

### Step 3: Login as Admin (for verification)

**POST /auth/login**

```bash
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "SecurePassword123!"
  }'
```

**Expected Response:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

### Step 4: Admin Verifies Payment Slip

**POST /admin/payments/8/verify**

```bash
curl -X POST http://localhost:4000/admin/payments/8/verify \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Verified bank transfer receipt"
  }'
```

**Expected Response:**

```json
{
  "paymentId": 8,
  "orderId": 5,
  "state": "verified",
  "orderStatus": "confirmed",
  "message": "Payment verified successfully. Order status updated to confirmed"
}
```

**Order Status Transition:**
- Before: `pending_payment` (or `payment_review` if slip was uploaded during checkout)
- After: `confirmed`

### Step 5: Admin Rejects Payment (Alternative Flow)

If verification fails, reject and ask for re-upload.

**POST /admin/payments/8/reject**

```bash
curl -X POST http://localhost:4000/admin/payments/8/reject \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Receipt amount does not match order total"
  }'
```

**Expected Response:**

```json
{
  "paymentId": 8,
  "orderId": 5,
  "state": "rejected",
  "orderStatus": "pending_payment",
  "message": "Payment rejected. Order status reverted to pending_payment"
}
```

**Order Status Transition:**
- Before: `payment_review`
- After: `pending_payment` (customer can re-upload)

### Step 6: Get Payment Details

**GET /admin/payments/8**

```bash
curl -X GET http://localhost:4000/admin/payments/8 \
  -H "Authorization: Bearer <accessToken>"
```

**Expected Response:**

```json
{
  "id": 8,
  "orderId": 5,
  "method": "bank_transfer",
  "state": "verified",
  "amount": "5250.00",
  "currency": "LKR",
  "slipUrl": "/uploads/slips/payment-8-a1b2c3d4e5f6g7h8.jpg",
  "gatewayRef": null,
  "createdAt": "2026-05-15T10:30:00Z",
  "updatedAt": "2026-05-15T10:35:00Z",
  "order": {
    "id": 5,
    "orderNumber": "ORD-20260515-ABC12",
    "status": "confirmed",
    "total": "5250.00",
    "customerName": "John Doe",
    "customerPhone": "+94701234567"
  }
}
```

## Workflow: COD (Cash on Delivery)

For COD, no slip is needed. Orders proceed to `pending_payment` status directly.

**POST /checkout (COD method)**

```bash
curl -X POST http://localhost:4000/checkout \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Jane Smith",
    "phone": "+94771234567",
    "email": "jane@example.com",
    "addressLine1": "456 Oak Ave",
    "city": "Colombo",
    "district": "Western",
    "postalCode": "00600",
    "country": "Sri Lanka",
    "deliveryPhone": "+94771234567",
    "items": [
      {
        "variantId": "1",
        "quantity": 1
      }
    ],
    "paymentMethod": "cod"
  }'
```

**Expected Response:**

```json
{
  "orderNumber": "ORD-20260515-XYZ99",
  "id": 6,
  "customerId": 4,
  "status": "pending_payment",
  "subtotal": "2500.00",
  "shippingFee": "250.00",
  "total": "2750.00",
  "paymentMethod": "cod",
  "message": "Order created successfully. Will be collected on delivery."
}
```

For COD, there's no payment verification step. Admin can proceed directly to `confirmed` status via `/admin/orders/{id}/status`.

## File Serving

Uploaded slips are accessible directly via browser/HTTP:

```
GET http://localhost:4000/uploads/slips/payment-8-a1b2c3d4e5f6g7h8.jpg
```

This returns the image file with appropriate MIME type headers.

## Status Transitions (Payment Flow)

```
┌─────────────────────┐
│   Create Order      │
│  (bank_transfer)    │
└──────────┬──────────┘
           │
           v
┌─────────────────────┐
│ pending_payment     │
│  (no slip yet)      │
└──────────┬──────────┘
           │
       (upload slip)
           │
           v
┌─────────────────────┐
│ payment_review      │
│ (admin review)      │
└──────┬───────────┬──┘
       │           │
   (verify)     (reject)
       │           │
       v           v
   confirmed  pending_payment
   (proceed)  (re-upload)
```

## Error Scenarios

### Missing Order ID

```bash
curl -X POST http://localhost:4000/payments/slip \
  -F "slip=@slip.jpg"
```

**Response (400):**

```json
{
  "error": "Order ID is required",
  "code": "MISSING_ORDER_ID"
}
```

### No File Provided

```bash
curl -X POST http://localhost:4000/payments/slip?orderId=5
```

**Response (400):**

```json
{
  "error": "No file provided",
  "code": "MISSING_FILE"
}
```

### Invalid File Type

```bash
curl -X POST http://localhost:4000/payments/slip?orderId=5 \
  -F "slip=@document.txt"
```

**Response (400):**

```json
{
  "error": "Only JPEG, PNG, WebP, and PDF files are allowed",
  "code": "SLIP_UPLOAD_FAILED"
}
```

### File Too Large (> 5MB)

```bash
curl -X POST http://localhost:4000/payments/slip?orderId=5 \
  -F "slip=@huge-image.jpg"
```

**Response (400):**

```json
{
  "error": "File size exceeds 5MB limit",
  "code": "SLIP_UPLOAD_FAILED"
}
```

### Invalid Payment State Transition

Trying to verify a payment that's not in `review` state:

```bash
curl -X POST http://localhost:4000/admin/payments/8/verify \
  -H "Authorization: Bearer <accessToken>"
```

(Payment is already in `verified` state)

**Response (400):**

```json
{
  "error": "Cannot verify payment in 'verified' state",
  "code": "VERIFY_PAYMENT_FAILED"
}
```

### Missing Admin Role

```bash
# Using staff token instead of admin
curl -X POST http://localhost:4000/admin/payments/8/verify \
  -H "Authorization: Bearer <staffToken>"
```

**Response (403):**

```json
{
  "error": "Forbidden: Admin role required",
  "code": "FORBIDDEN"
}
```

## Audit Logging

All payment verification and rejection actions are logged with:
- Admin user ID
- Payment ID
- Order ID
- Previous state
- New state
- Optional notes/reason

View audit logs in database:

```sql
SELECT * FROM AuditLog WHERE paymentId = 8 ORDER BY createdAt DESC;
```

## Data Storage

- **Payment Records:** MySQL database (`Payment` table)
- **Uploaded Files:** Local disk at `backend/uploads/slips/`
- **Audit Trail:** MySQL database (`AuditLog` table)

## Notes

- Slip files are named `payment-{paymentId}-{random}.{ext}` for uniqueness
- Payment and order records are immutable (timestamps auto-set)
- Only admin can verify/reject payments
- Each order can have multiple payment records (if slip re-upload happens)
- Idempotency is enforced for webhook events via `IdempotencyEvent` table (future use)

## Next Steps (Phase 7)

- Email notifications on payment verification/rejection
- WhatsApp messages on status changes
- Payment gateway integration webhooks
