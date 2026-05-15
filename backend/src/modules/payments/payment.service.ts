import path from "path";
import fs from "fs/promises";
import crypto from "crypto";
import { getPrisma } from "../../db/prisma";
import { formatDecimal } from "../../utils/money";
import { auditAction } from "../../utils/audit-log";
import type { AuthenticatedUser } from "../../types";
import type { VerifyPaymentRequestSchema, RejectPaymentRequestSchema } from "../../schemas/payment.schema";

// ============ FILE STORAGE CONFIGURATION ============

const UPLOADS_DIR = path.join(process.cwd(), "backend", "uploads", "slips");
const SLIP_URL_PREFIX = "/uploads/slips";

/**
 * Ensure uploads directory exists
 */
export async function ensureUploadsDir() {
  try {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
  } catch (error) {
    console.error("Failed to create uploads directory:", error);
    throw error;
  }
}

/**
 * Generate a safe filename for payment slip
 */
function generateSlipFilename(paymentId: bigint, originalFileName: string): string {
  const ext = path.extname(originalFileName) || ".jpg";
  const randomSuffix = crypto.randomBytes(8).toString("hex");
  return `payment-${paymentId}-${randomSuffix}${ext}`;
}

// ============ SLIP UPLOAD ============

/**
 * Save payment slip file to local disk and create payment record
 */
export async function savePaymentSlip(
  orderId: bigint,
  fileBuffer: Buffer,
  originalFileName: string,
): Promise<any> {
  const prisma = getPrisma() as any;

  // Verify order exists
  const order = await prisma.salesOrder.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  // Check if payment already exists
  let payment = await prisma.payment.findFirst({
    where: { orderId },
  });

  if (!payment) {
    // Create new payment record
    payment = await prisma.payment.create({
      data: {
        orderId,
        method: "bank_transfer",
        state: "review",
        amount: order.total,
        currency: "LKR",
      },
    });
  }

  // Save file to disk
  const filename = generateSlipFilename(payment.id, originalFileName);
  const filepath = path.join(UPLOADS_DIR, filename);

  await fs.writeFile(filepath, fileBuffer);

  // Update payment with slip URL
  const updatedPayment = await prisma.payment.update({
    where: { id: payment.id },
    data: {
      slipUrl: `${SLIP_URL_PREFIX}/${filename}`,
      state: "review",
    },
  });

  return {
    paymentId: updatedPayment.id,
    orderId: updatedPayment.orderId,
    slipUrl: updatedPayment.slipUrl,
    state: updatedPayment.state,
  };
}

// ============ PAYMENT VERIFICATION ============

/**
 * Admin verifies a payment slip
 * Updates payment state to "verified" and order status to "confirmed"
 */
export async function verifyPayment(
  paymentId: bigint,
  user: AuthenticatedUser,
  input: VerifyPaymentRequestSchema,
): Promise<any> {
  const prisma = getPrisma() as any;

  // Get payment with order details
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { order: true },
  });

  if (!payment) {
    throw new Error("Payment not found");
  }

  // Only allow verifying from 'review' state
  if (payment.state !== "review") {
    throw new Error(`Cannot verify payment in '${payment.state}' state`);
  }

  // Update payment state
  const updatedPayment = await prisma.payment.update({
    where: { id: paymentId },
    data: { state: "verified" },
  });

  // Update order status to 'confirmed'
  const updatedOrder = await prisma.salesOrder.update({
    where: { id: payment.orderId },
    data: { status: "confirmed" },
  });

  // Record audit log
  await auditAction(
    "payment_verified",
    user,
    {
      paymentId,
      orderId: payment.orderId,
      meta: {
        previousState: payment.state,
        newState: "verified",
        notes: input.notes || null,
      },
    },
  );

  return {
    paymentId: updatedPayment.id,
    orderId: updatedOrder.id,
    orderNumber: updatedOrder.orderNumber,
    state: updatedPayment.state,
    orderStatus: updatedOrder.status,
  };
}

// ============ PAYMENT REJECTION ============

/**
 * Admin rejects a payment slip
 * Updates payment state to "rejected" and order status back to "pending_payment"
 */
export async function rejectPayment(
  paymentId: bigint,
  user: AuthenticatedUser,
  input: RejectPaymentRequestSchema,
): Promise<any> {
  const prisma = getPrisma() as any;

  // Get payment with order details
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { order: true },
  });

  if (!payment) {
    throw new Error("Payment not found");
  }

  // Only allow rejecting from 'review' state
  if (payment.state !== "review") {
    throw new Error(`Cannot reject payment in '${payment.state}' state`);
  }

  // Update payment state
  const updatedPayment = await prisma.payment.update({
    where: { id: paymentId },
    data: { state: "rejected" },
  });

  // Update order status back to 'pending_payment'
  const updatedOrder = await prisma.salesOrder.update({
    where: { id: payment.orderId },
    data: { status: "pending_payment" },
  });

  // Record audit log
  await auditAction(
    "payment_rejected",
    user,
    {
      paymentId,
      orderId: payment.orderId,
      meta: {
        previousState: payment.state,
        newState: "rejected",
        reason: input.reason,
      },
    },
  );

  return {
    paymentId: updatedPayment.id,
    orderId: updatedOrder.id,
    orderNumber: updatedOrder.orderNumber,
    state: updatedPayment.state,
    orderStatus: updatedOrder.status,
  };
}

// ============ PAYMENT QUERIES ============

/**
 * Get payment details with order info
 */
export async function getPaymentById(paymentId: bigint) {
  const prisma = getPrisma() as any;

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      order: {
        select: {
          id: true,
          orderNumber: true,
          status: true,
          total: true,
          customer: {
            select: {
              fullName: true,
              phone: true,
            },
          },
        },
      },
    },
  });

  if (!payment) {
    return null;
  }

  // Serialize response
  return {
    ...payment,
    amount: formatDecimal(payment.amount),
    order: {
      ...payment.order,
      total: formatDecimal(payment.order.total),
      customerName: payment.order.customer.fullName,
      customerPhone: payment.order.customer.phone,
    },
  };
}

/**
 * Get payment details with customer info (for email sending)
 */
export async function getPaymentWithCustomer(paymentId: bigint) {
  const prisma = getPrisma() as any;

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      order: {
        select: {
          orderNumber: true,
          customer: {
            select: {
              fullName: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (!payment) {
    return null;
  }

  return {
    ...payment,
    amount: formatDecimal(payment.amount),
    orderNumber: payment.order.orderNumber,
    customer: payment.order.customer,
  };
}

/**
 * Get payments for an order
 */
export async function getPaymentsByOrderId(orderId: bigint) {
  const prisma = getPrisma() as any;

  const payments = await prisma.payment.findMany({
    where: { orderId },
    orderBy: { createdAt: "desc" },
  });

  return payments.map((payment: any) => ({
    ...payment,
    amount: formatDecimal(payment.amount),
  }));
}
