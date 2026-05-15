import "dotenv/config";
import { createApp } from "./app";
import { env } from "./config/env";
import { registerPrismaShutdownHooks } from "./db/prisma";
import { ensureUploadsDir } from "./modules/payments/payment.service";
import { initializeEmailTransporter, testEmailConnection } from "./config/email";
import { initializeWhatsAppClient, destroyWhatsAppClient } from "./config/whatsapp.config";
import { initializeWhatsAppHandlers } from "./modules/messaging/whatsapp.service";
import { jobQueue } from "./jobs/queue";
import { sendEmailWorker } from "./jobs/workers/send-email.worker";
import { sendWhatsAppWorker } from "./jobs/workers/send-whatsapp.worker";

const app = createApp();

registerPrismaShutdownHooks();

// Initialize uploads directory
ensureUploadsDir().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Failed to initialize uploads directory:", error);
  process.exit(1);
});

// Initialize email transporter
initializeEmailTransporter();

// Test email connection if enabled
if (env.SMTP_ENABLED === "true") {
  testEmailConnection().then((ok) => {
    if (!ok) {
      // eslint-disable-next-line no-console
      console.warn("⚠ Email transporter verification failed. Emails may not be sent.");
    }
  });
}

// Register email worker
jobQueue.registerWorker("send_email", sendEmailWorker);

// Register WhatsApp worker
jobQueue.registerWorker("send_whatsapp", sendWhatsAppWorker);

// Initialize WhatsApp client
initializeWhatsAppClient().catch((error) => {
  // eslint-disable-next-line no-console
  console.warn("⚠ Failed to initialize WhatsApp client:", error);
});

// Initialize WhatsApp inbound message handlers
initializeWhatsAppHandlers();

// Start job queue processing
const server = app.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${env.PORT}`);
});

// Graceful shutdown: stop job queue, destroy WhatsApp client, and close server
process.on("SIGTERM", () => {
  // eslint-disable-next-line no-console
  console.log("SIGTERM received, shutting down gracefully...");
  jobQueue.stopProcessing();
  destroyWhatsAppClient().catch((e) => console.error("Error destroying WhatsApp:", e));
  server.close(() => {
    // eslint-disable-next-line no-console
    console.log("Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  // eslint-disable-next-line no-console
  console.log("SIGINT received, shutting down gracefully...");
  jobQueue.stopProcessing();
  destroyWhatsAppClient().catch((e) => console.error("Error destroying WhatsApp:", e));
  server.close(() => {
    // eslint-disable-next-line no-console
    console.log("Server closed");
    process.exit(0);
  });
});
