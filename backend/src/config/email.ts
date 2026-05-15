import nodemailer from "nodemailer";
import { env } from "../config/env";

let transporter: nodemailer.Transporter | null = null;

/**
 * Initialize email transporter (SMTP configuration)
 * Returns null if email is disabled or configuration is incomplete
 */
export function initializeEmailTransporter() {
  // Skip if disabled
  if (env.SMTP_ENABLED !== "true") {
    // eslint-disable-next-line no-console
    console.log("Email sending is disabled (SMTP_ENABLED != true)");
    return null;
  }

  // Validate required config
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASSWORD || !env.SMTP_FROM) {
    // eslint-disable-next-line no-console
    console.warn("Email configuration incomplete. Emails will not be sent.");
    return null;
  }

  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465, // Use TLS for 587, SSL for 465
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASSWORD,
    },
  });

  // eslint-disable-next-line no-console
  console.log(`Email transporter initialized: ${env.SMTP_HOST}:${env.SMTP_PORT}`);
  return transporter;
}

/**
 * Get email transporter instance
 */
export function getEmailTransporter(): nodemailer.Transporter | null {
  return transporter;
}

/**
 * Test SMTP connection
 */
export async function testEmailConnection(): Promise<boolean> {
  if (!transporter) {
    return false;
  }

  try {
    await transporter.verify();
    // eslint-disable-next-line no-console
    console.log("✓ Email transporter verified successfully");
    return true;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("✗ Email transporter verification failed:", error);
    return false;
  }
}

/**
 * Send raw email
 */
export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<boolean> {
  if (!transporter) {
    // eslint-disable-next-line no-console
    console.warn("Email transporter not initialized. Email not sent.");
    return false;
  }

  try {
    await transporter.sendMail({
      from: env.SMTP_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || undefined,
    });

    // eslint-disable-next-line no-console
    console.log(`✓ Email sent to ${options.to}: ${options.subject}`);
    return true;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`✗ Failed to send email to ${options.to}:`, error);
    return false;
  }
}
