import "dotenv/config";
import { createApp } from "./app";
import { env } from "./config/env";
import { registerPrismaShutdownHooks } from "./db/prisma";
import { ensureUploadsDir } from "./modules/payments/payment.service";
import { initializeEmailTransporter, testEmailConnection } from "./config/email";
import { jobQueue } from "./jobs/queue";
import { sendEmailWorker } from "./jobs/workers/send-email.worker";

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

// Start job queue processing
const server = app.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${env.PORT}`);
});

// Graceful shutdown: stop job queue and close server
process.on("SIGTERM", () => {
  // eslint-disable-next-line no-console
  console.log("SIGTERM received, shutting down gracefully...");
  jobQueue.stopProcessing();
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
  server.close(() => {
    // eslint-disable-next-line no-console
    console.log("Server closed");
    process.exit(0);
  });
});
