/**
 * WhatsApp Service
 * 
 * Handles WhatsApp message sending and inbound message processing
 */

import {
  sendWhatsAppMessage as sendWAMessage,
  sendWhatsAppMedia,
  onInboundMessage,
  isWhatsAppReady,
} from "../../config/whatsapp.config";
import { getPrisma } from "../../db/prisma";

// ============================================================================
// TYPES
// ============================================================================

export interface SendWhatsAppParams {
  to: string;
  message: string;
  metadata?: {
    orderId?: bigint;
    customerId?: bigint;
    eventType?: string;
  };
}

export interface SendWhatsAppResponse {
  success: boolean;
  messageSid?: string;
  error?: string;
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize WhatsApp inbound message handlers
 * Called once on app startup
 */
export function initializeWhatsAppHandlers(): void {
  onInboundMessage(async (message) => {
    try {
      console.log(
        `📨 Inbound WhatsApp message from ${message.from}: ${message.body.substring(0, 50)}...`
      );

      // Store message in database
      await storeInboundMessage(message);

      // Process message for order creation/lookup
      // TODO: Implement order creation from WhatsApp messages
    } catch (error) {
      console.error(`Error handling inbound WhatsApp message: ${error}`);
    }
  });
}

// ============================================================================
// SEND MESSAGE
// ============================================================================

/**
 * Send a WhatsApp message
 */
export async function sendWhatsAppMessageService(
  params: SendWhatsAppParams
): Promise<SendWhatsAppResponse> {
  try {
    if (!isWhatsAppReady()) {
      return {
        success: false,
        error: "WhatsApp client is not ready",
      };
    }

    const messageSid = await sendWAMessage(params.to, params.message);

    // Store sent message in database
    try {
      await storeOutboundMessage({
        to: params.to,
        body: params.message,
        messageSid,
        metadata: params.metadata,
      });
    } catch (dbError) {
      console.warn(`Failed to store outbound message in DB: ${dbError}`);
      // Don't fail the whole operation if DB storage fails
    }

    return {
      success: true,
      messageSid,
    };
  } catch (error) {
    console.error(`Failed to send WhatsApp message: ${error}`);
    return {
      success: false,
      error: String(error),
    };
  }
}

// ============================================================================
// DATABASE HELPERS
// ============================================================================

/**
 * Store inbound message in database
 */
async function storeInboundMessage(message: {
  from: string;
  to: string;
  body: string;
  timestamp: number;
  hasMedia: boolean;
  mediaUrl?: string;
}): Promise<void> {
  try {
    const prisma = getPrisma() as any;

    // Format phone number (remove whatsapp: prefix if present)
    const fromPhone = message.from.replace(/whatsapp:/, "").replace(/@.*/, "");
    const toPhone = message.to.replace(/whatsapp:/, "").replace(/@.*/, "");

    // Find or create customer by phone
    let customer = await prisma.customer.findUnique({
      where: { phone: fromPhone },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          phone: fromPhone,
          name: "WhatsApp Customer", // Will be updated when they place order
          email: `wa-${fromPhone}@homebiz.local`, // Placeholder
        },
      });
      console.log(`Created new customer from WhatsApp: ${fromPhone}`);
    }

    // Find or create message thread
    let thread = await prisma.messageThread.findFirst({
      where: {
        customerId: customer.id,
        channel: "WHATSAPP",
      },
    });

    if (!thread) {
      thread = await prisma.messageThread.create({
        data: {
          customerId: customer.id,
          channel: "WHATSAPP",
          threadId: fromPhone, // Use phone as thread identifier
        },
      });
    }

    // Store message
    await prisma.message.create({
      data: {
        threadId: thread.id,
        direction: "INBOUND",
        body: message.body,
        ...(message.mediaUrl ? { mediaUrl: message.mediaUrl } : {}),
        externalMessageId: message.from, // WhatsApp message ID
      },
    });

    console.log(`Stored inbound WhatsApp message from ${fromPhone}`);
  } catch (error) {
    console.error(`Error storing inbound message: ${error}`);
    throw error;
  }
}

/**
 * Store outbound message in database
 */
async function storeOutboundMessage(message: {
  to: string;
  body: string;
  messageSid: string;
  metadata?: any;
}): Promise<void> {
  try {
    const prisma = getPrisma() as any;

    // Format phone number
    const toPhone = message.to.replace(/whatsapp:/, "").replace(/@.*/, "");

    // Find customer
    const customer = await prisma.customer.findUnique({
      where: { phone: toPhone },
    });

    if (!customer) {
      console.warn(`Customer not found for phone ${toPhone}, skipping message storage`);
      return;
    }

    // Find or create message thread
    let thread = await prisma.messageThread.findFirst({
      where: {
        customerId: customer.id,
        channel: "WHATSAPP",
      },
    });

    if (!thread) {
      thread = await prisma.messageThread.create({
        data: {
          customerId: customer.id,
          channel: "WHATSAPP",
          threadId: toPhone,
        },
      });
    }

    // Store message
    await prisma.message.create({
      data: {
        threadId: thread.id,
        direction: "OUTBOUND",
        body: message.body,
        externalMessageId: message.messageSid,
      },
    });

    console.log(`Stored outbound WhatsApp message to ${toPhone}`);
  } catch (error) {
    console.error(`Error storing outbound message: ${error}`);
    throw error;
  }
}

// ============================================================================
// TEMPLATE MESSAGES (for future use)
// ============================================================================

/**
 * Send order confirmation via WhatsApp
 */
export async function sendOrderConfirmationWhatsApp(
  customerPhone: string,
  orderNumber: string,
  total: string
): Promise<SendWhatsAppResponse> {
  const message = `✅ Order Confirmed!\n\nOrder #${orderNumber}\nTotal: Rs. ${total}\n\nYou will receive updates on your order status.`;

  return sendWhatsAppMessageService({
    to: customerPhone,
    message,
    metadata: {
      eventType: "order_confirmation",
    },
  });
}

/**
 * Send order status update via WhatsApp
 */
export async function sendOrderStatusUpdateWhatsApp(
  customerPhone: string,
  orderNumber: string,
  status: string
): Promise<SendWhatsAppResponse> {
  const message = `📦 Order Status Update\n\nOrder #${orderNumber}\nNew Status: ${status}\n\nThank you for your purchase!`;

  return sendWhatsAppMessageService({
    to: customerPhone,
    message,
    metadata: {
      eventType: "order_status_update",
    },
  });
}

/**
 * Send payment confirmation via WhatsApp
 */
export async function sendPaymentConfirmationWhatsApp(
  customerPhone: string,
  orderNumber: string,
  amount: string
): Promise<SendWhatsAppResponse> {
  const message = `💰 Payment Received!\n\nOrder #${orderNumber}\nAmount: Rs. ${amount}\n\nYour payment has been verified. We'll start processing your order now.`;

  return sendWhatsAppMessageService({
    to: customerPhone,
    message,
    metadata: {
      eventType: "payment_confirmed",
    },
  });
}
