/**
 * Email Job Worker - Processes email sending jobs from the queue
 */

import { sendEmail } from "../../config/email";
import type { Job, EmailJobData } from "../queue";

/**
 * Email worker handler
 * Processes send_email jobs from the queue
 */
export async function sendEmailWorker(job: Job<EmailJobData>): Promise<void> {
  const data = job.data as EmailJobData;

  // Validate required fields
  if (!data.to || !data.subject || !data.html) {
    throw new Error("Missing required email fields: to, subject, html");
  }

  // Attempt to send email
  const sent = await sendEmail({
    to: data.to,
    subject: data.subject,
    html: data.html,
    ...(data.text ? { text: data.text } : {}),
  });

  if (!sent) {
    throw new Error(`Failed to send email to ${data.to}`);
  }
}
