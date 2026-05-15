# Phase 8: WhatsApp Integration Testing Guide

This guide covers testing the WhatsApp messaging module using **whatsapp-web.js** for browser automation.

## Overview

Phase 8 implements WhatsApp messaging using `whatsapp-web.js`, which:
- ✅ Automates WhatsApp Web using browser automation (Puppeteer)
- ✅ Generates QR code to link personal/business WhatsApp account
- ✅ Sends messages asynchronously via job queue
- ✅ Stores inbound/outbound messages in database
- ✅ **No per-message costs** (free alternative to Twilio)

## Important Setup Requirements

### Chromium Browser Installation

whatsapp-web.js requires Chromium/Chrome to be installed on your system:

**Windows:**
```bash
# Option 1: Use Puppeteer's bundled Chromium (automatic, but large download)
npm install

# Option 2: Use system Google Chrome
# Google Chrome should already be installed; Puppeteer will find it
```

**macOS:**
```bash
# Install Google Chrome
brew install google-chrome
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install -y chromium-browser
```

### Environment Setup

1. Ensure `.env` has WhatsApp enabled:
   ```env
   WHATSAPP_ENABLED="true"
   ```

2. Sessions will be stored in `.wbot_sessions/` directory (auto-created on first run)

3. `.wbot_sessions/` should be added to `.gitignore` (auto-managed by backend)

## Testing Workflow

### 1. Start the Backend

```bash
cd backend
npm run dev
```

Expected output:
```
📱 Initializing WhatsApp Web client...
🚀 WhatsApp client initialization started
API listening on http://localhost:4000
```

### 2. Get QR Code for Account Linking

**Endpoint:** `GET /webhooks/whatsapp/qr`

```bash
curl http://localhost:4000/webhooks/whatsapp/qr
```

**Response (on first run - needs QR scan):**
```json
{
  "success": true,
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...",
  "status": "pending",
  "message": "Scan this QR code with your WhatsApp device to link your account",
  "state": {
    "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...",
    "isReady": false,
    "isInitializing": true,
    "authError": null
  }
}
```

**Frontend Integration:**
1. Display the `qrCode` (base64 data URL) as an `<img />` tag
2. User scans with their phone WhatsApp camera
3. Scan opens WhatsApp Web and authenticates on backend
4. After auth, refresh `/webhooks/whatsapp/status` to confirm connection

### 3. Check WhatsApp Status

**Endpoint:** `GET /webhooks/whatsapp/status`

```bash
curl http://localhost:4000/webhooks/whatsapp/status
```

**Response (before authentication):**
```json
{
  "success": true,
  "ready": false,
  "initializing": true,
  "hasQR": true,
  "authError": null,
  "message": "Please scan the QR code to authenticate"
}
```

**Response (after authentication):**
```json
{
  "success": true,
  "ready": true,
  "initializing": false,
  "hasQR": false,
  "authError": null,
  "message": "WhatsApp client is ready and connected"
}
```

### 4. Send a WhatsApp Message (Job Queue)

Once authenticated, the job queue can send messages. Queue a message via the messaging service:

**Example: Queue Order Confirmation Message**

```bash
# Using order confirmation webhook (internal)
curl -X POST http://localhost:4000/admin/orders/123/send-whatsapp \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customerPhone": "+94771234567",
    "orderNumber": "ORD-20260515-00001",
    "total": "2500"
  }'
```

**Via Job Queue (direct messaging service):**

The backend will queue a WhatsApp message job:

```bash
# Check job status
curl http://localhost:4000/admin/jobs/queue-stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Response:
```json
{
  "queueStats": {
    "total": 1,
    "pending": 0,
    "processing": 0,
    "completed": 1,
    "failed": 0
  }
}
```

### 5. Verify Message Was Sent

Check the database to confirm the message was stored:

```sql
SELECT * FROM Message WHERE direction = 'OUTBOUND' ORDER BY createdAt DESC LIMIT 5;
```

Also check your WhatsApp app on your phone - you should receive the message!

### 6. Receive Inbound Messages

When you send a message from your WhatsApp phone to the linked account:

1. **WhatsApp Web** receives the message
2. **whatsapp-web.js** detects the inbound event
3. **Backend** stores message in database (MessageThread + Message)
4. **Inbound handlers** process the message (can trigger order creation, lookup, etc.)

**Check stored messages:**
```sql
SELECT * FROM Message WHERE direction = 'INBOUND' ORDER BY createdAt DESC LIMIT 5;
SELECT * FROM MessageThread WHERE channel = 'WHATSAPP';
```

### 7. Logout from WhatsApp

**Endpoint:** `POST /webhooks/whatsapp/logout`

```bash
curl -X POST http://localhost:4000/webhooks/whatsapp/logout
```

Response:
```json
{
  "success": true,
  "message": "Logged out from WhatsApp. Scan the QR code again to reconnect."
}
```

After logout, you'll need to scan the QR code again to reconnect.

### 8. Reinitialize WhatsApp Client

If the client gets stuck or disconnects unexpectedly:

**Endpoint:** `POST /webhooks/whatsapp/reinit`

```bash
curl -X POST http://localhost:4000/webhooks/whatsapp/reinit
```

Response:
```json
{
  "success": true,
  "message": "WhatsApp client reinitialization started",
  "state": {
    "qrCode": null,
    "isReady": false,
    "isInitializing": true,
    "authError": null
  }
}
```

## Testing Different Scenarios

### Scenario 1: Order Confirmation via WhatsApp

1. Place order via `/checkout` endpoint
2. Backend queues email + WhatsApp confirmation
3. Check WhatsApp on your phone for the message

**Example order checkout:**
```bash
curl -X POST http://localhost:4000/checkout \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "John Doe",
    "customerPhone": "+94771234567",
    "customerEmail": "john@example.com",
    "deliveryAddress": "123 Main St, Colombo",
    "paymentMethod": "COD",
    "items": [
      {
        "variantId": 1,
        "quantity": 2
      }
    ]
  }'
```

### Scenario 2: Order Status Update via WhatsApp

1. Admin updates order status via `/admin/orders/{id}/status`
2. Backend queues email + WhatsApp status update
3. Customer receives WhatsApp notification

**Example:**
```bash
curl -X PATCH http://localhost:4000/admin/orders/123/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "newStatus": "shipped",
    "notes": "Your order is on its way!"
  }'
```

### Scenario 3: Payment Confirmation via WhatsApp

1. Admin verifies payment slip via `/admin/payments/{id}/verify`
2. Backend queues payment confirmation message
3. Customer receives WhatsApp payment confirmation

### Scenario 4: Inbound WhatsApp Message (Customer Inquiry)

1. Send message from WhatsApp to the linked account
2. Backend receives message via WhatsApp Web webhook
3. Message stored in `Message` table with `direction: INBOUND`
4. **Future**: Trigger order creation/lookup workflows

**View stored inbound messages:**
```sql
SELECT m.*, mt.threadId 
FROM Message m 
JOIN MessageThread mt ON m.threadId = mt.id 
WHERE m.direction = 'INBOUND' 
ORDER BY m.createdAt DESC 
LIMIT 10;
```

## Troubleshooting

### Issue: QR Code not showing / Stuck on initialization

**Cause:** Chromium browser not installed or puppeteer download failed

**Solution:**
```bash
# Windows: Ensure Google Chrome is installed
# Or reinstall puppeteer
npm install puppeteer --force

# macOS
brew install google-chrome

# Linux (Ubuntu)
sudo apt-get install -y chromium-browser
```

### Issue: "WhatsApp client is not ready" error

**Cause:** QR code not scanned or authentication failed

**Solution:**
1. Check `/webhooks/whatsapp/status` - should show `ready: true`
2. If `hasQR: true`, get fresh QR at `/webhooks/whatsapp/qr`
3. Scan with WhatsApp on phone
4. Wait 10-15 seconds for browser automation to complete

### Issue: Messages not being sent

**Cause:** Job queue not running or WhatsApp client not ready

**Solution:**
1. Check WhatsApp status: `GET /webhooks/whatsapp/status`
2. Verify job queue is processing: Check console logs for `[Queue] Processing job`
3. Check for errors in browser: WhatsApp Web may have logged out on your phone
4. Try `/webhooks/whatsapp/reinit` to restart client

### Issue: Session lost on app restart

**Cause:** Browser session cleared or Chromium crashed

**Solution:**
- Sessions are stored in `.wbot_sessions/` directory
- QR code only needed on first authentication
- If session lost, scan QR code again
- Check that `.wbot_sessions/` directory is writable

## Key Files

- `src/config/whatsapp.config.ts` - WhatsApp client initialization & QR generation
- `src/modules/webhooks/whatsapp.routes.ts` - QR & status endpoints
- `src/modules/messaging/whatsapp.service.ts` - Message sending & inbound handling
- `src/jobs/workers/send-whatsapp.worker.ts` - Async job worker
- `src/modules/messaging/messaging.service.ts` - Queue functions (queueOrderConfirmationWhatsApp, etc.)
- `.wbot_sessions/` - Session storage (auto-created, add to .gitignore)

## Next Steps

After testing:

1. **Integrate with Frontend**: Display QR code UI for account linking
2. **Webhook Events**: Implement order creation from WhatsApp messages
3. **Template Messages**: Add WhatsApp message templates (after Meta approval for business account)
4. **Media Support**: Send order images/invoices via WhatsApp media
5. **Production Deployment**: Configure headless Chromium for server environments
