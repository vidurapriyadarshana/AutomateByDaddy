/**
 * Email Messaging Service
 * Handles queueing emails for orders, payments, and status updates
 */

import { jobQueue } from "../../jobs/queue";
import {
  generateOrderConfirmationEmail,
  generateOrderStatusUpdateEmail,
  generatePaymentVerifiedEmail,
  generatePaymentRejectedEmail,
} from "../../utils/email-templates";

// ============ ORDER EMAILS ============

/**
 * Queue order confirmation email
 */
export async function queueOrderConfirmationEmail(params: {
  customerEmail: string;
  customerName: string;
  orderNumber: string;
  orderId: bigint;
  total: string;
  items: Array<{ name: string; quantity: number; price: string }>;
  deliveryAddress: string;
  paymentMethod: string;
  estimatedDeliveryDate?: string;
}): Promise<string> {
  const html = generateOrderConfirmationEmail({
    customerName: params.customerName,
    orderNumber: params.orderNumber,
    total: params.total,
    items: params.items,
    deliveryAddress: params.deliveryAddress,
    paymentMethod: params.paymentMethod,
    ...(params.estimatedDeliveryDate ? { estimatedDeliveryDate: params.estimatedDeliveryDate } : {}),
  });

  const jobId = await jobQueue.addJob("send_email", {
    to: params.customerEmail,
    subject: `Order Confirmation - ${params.orderNumber}`,
    html,
    metadata: {
      orderId: params.orderId,
      eventType: "order_confirmation",
    },
  });

  return jobId;
}

// ============ ORDER STATUS EMAILS ============

/**
 * Queue order status update email
 */
export async function queueOrderStatusUpdateEmail(params: {
  customerEmail: string;
  customerName: string;
  orderNumber: string;
  orderId: bigint;
  previousStatus: string;
  newStatus: string;
  statusMessage: string;
  trackingNumber?: string;
}): Promise<string> {
  const html = generateOrderStatusUpdateEmail({
    customerName: params.customerName,
    orderNumber: params.orderNumber,
    previousStatus: params.previousStatus,
    newStatus: params.newStatus,
    statusMessage: params.statusMessage,
    ...(params.trackingNumber ? { trackingNumber: params.trackingNumber } : {}),
  });

  const jobId = await jobQueue.addJob("send_email", {
    to: params.customerEmail,
    subject: `Order Update: ${params.newStatus.toUpperCase()} - ${params.orderNumber}`,
    html,
    metadata: {
      orderId: params.orderId,
      eventType: "order_status_update",
    },
  });

  return jobId;
}

// ============ PAYMENT EMAILS ============

/**
 * Queue payment verified email
 */
export async function queuePaymentVerifiedEmail(params: {
  customerEmail: string;
  customerName: string;
  orderNumber: string;
  orderId: bigint;
  paymentId: bigint;
  amount: string;
  nextStep?: string;
}): Promise<string> {
  const nextStep =
    params.nextStep ||
    "Your order will be processed soon. You will receive an update when it ships.";

  const html = generatePaymentVerifiedEmail({
    customerName: params.customerName,
    orderNumber: params.orderNumber,
    amount: params.amount,
    nextStep,
  });

  const jobId = await jobQueue.addJob("send_email", {
    to: params.customerEmail,
    subject: `Payment Confirmed - ${params.orderNumber}`,
    html,
    metadata: {
      orderId: params.orderId,
      paymentId: params.paymentId,
      eventType: "payment_verified",
    },
  });

  return jobId;
}

/**
 * Queue payment rejected email
 */
export async function queuePaymentRejectedEmail(params: {
  customerEmail: string;
  customerName: string;
  orderNumber: string;
  orderId: bigint;
  paymentId: bigint;
  reason: string;
  nextStep?: string;
}): Promise<string> {
  const nextStep =
    params.nextStep ||
    `Please upload a new payment slip. Visit your order page and re-upload the slip. If the issue persists, contact our support team.`;

  const html = generatePaymentRejectedEmail({
    customerName: params.customerName,
    orderNumber: params.orderNumber,
    reason: params.reason,
    nextStep,
  });

  const jobId = await jobQueue.addJob("send_email", {
    to: params.customerEmail,
    subject: `Payment Issue - Action Required - ${params.orderNumber}`,
    html,
    metadata: {
      orderId: params.orderId,
      paymentId: params.paymentId,
      eventType: "payment_rejected",
    },
  });

  return jobId;
}
