/**
 * WhatsApp Job Worker
 * 
 * Handles async sending of WhatsApp messages via job queue
 * Called from messaging.service.ts via jobQueue.addJob()
 */

import { sendWhatsAppMessageService } from "../../modules/messaging/whatsapp.service";
import type { Job } from "../../jobs/queue";

// ============================================================================
// WORKER HANDLER
// ============================================================================

/**
 * Send WhatsApp message job handler
 * Registered via: jobQueue.registerWorker("send_whatsapp", sendWhatsAppWorker)
 */
export async function sendWhatsAppWorker(job: Job): Promise<void> {
  try {
    const payload = job.data;

    if (!payload.to || !payload.message) {
      throw new Error("Missing required fields: to, message");
    }

    console.log(
      `🤖 WhatsApp worker processing job: to=${payload.to}, event=${payload.metadata?.eventType}`
    );

    const result = await sendWhatsAppMessageService({
      to: payload.to,
      message: payload.message,
      metadata: payload.metadata,
    });

    if (!result.success) {
      throw new Error(result.error || "Unknown error sending WhatsApp message");
    }

    console.log(`✓ WhatsApp message sent successfully: ${result.messageSid}`);
  } catch (error) {
    console.error(`✗ WhatsApp worker failed: ${error}`);
    throw error; // Re-throw so job queue can retry
  }
}
