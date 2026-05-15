import type { Request, Response } from "express";
import multer from "multer";
import { z } from "zod";
import {
  savePaymentSlip,
  verifyPayment,
  rejectPayment,
  getPaymentById,
  getPaymentWithCustomer,
} from "./payment.service";
import {
  SlipUploadResponseSchema,
  VerifyPaymentRequestSchema,
  RejectPaymentRequestSchema,
  PaymentActionResponseSchema,
  AdminPaymentDetailResponseSchema,
} from "../../schemas/payment.schema";
import { queuePaymentVerifiedEmail, queuePaymentRejectedEmail } from "../messaging/messaging.service";
import type { AuthenticatedUser } from "../../types";

// ============ MULTER CONFIGURATION ============

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
  fileFilter: (_req: any, file: any, cb: any) => {
    // Only allow image and PDF files
    const allowedMimes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, WebP, and PDF files are allowed"));
    }
  },
});

// ============ UPLOAD SLIP ENDPOINT ============

/**
 * POST /payments/slip
 * Public endpoint: Customer uploads payment slip
 */
export async function uploadSlip(req: Request, res: Response) {
  try {
    const multerReq = req as any;
    if (!multerReq.file) {
      return res.status(400).json({
        error: "No file provided",
        code: "MISSING_FILE",
      });
    }

    // Parse and validate order ID from query
    const { orderId } = req.query;

    if (!orderId || typeof orderId !== "string") {
      return res.status(400).json({
        error: "Order ID is required",
        code: "MISSING_ORDER_ID",
      });
    }

    const parsedOrderId = BigInt(orderId);

    // Save slip
    const result = await savePaymentSlip(
      parsedOrderId,
      multerReq.file.buffer,
      multerReq.file.originalname,
    );

    // Validate and serialize response
    const response = SlipUploadResponseSchema.parse({
      paymentId: result.paymentId,
      slipUrl: result.slipUrl,
      state: result.state,
      message: "Payment slip uploaded successfully",
    });

    res.status(200).json(response);
  } catch (error: any) {
    res.status(400).json({
      error: error.message,
      code: "SLIP_UPLOAD_FAILED",
    });
  }
}

// ============ GET PAYMENT DETAILS (ADMIN) ============

/**
 * GET /admin/payments/:id
 * Admin endpoint: Get payment details
 */
export async function getPaymentDetails(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!id || typeof id !== "string") {
      return res.status(400).json({
        error: "Payment ID is required",
        code: "INVALID_PAYMENT_ID",
      });
    }
    const paymentId = BigInt(id);

    const payment = await getPaymentById(paymentId);

    if (!payment) {
      return res.status(404).json({
        error: "Payment not found",
        code: "PAYMENT_NOT_FOUND",
      });
    }

    // Validate and serialize response
    const response = AdminPaymentDetailResponseSchema.parse(payment);
    res.status(200).json(response);
  } catch (error: any) {
    res.status(400).json({
      error: error.message,
      code: "GET_PAYMENT_FAILED",
    });
  }
}

// ============ VERIFY PAYMENT (ADMIN) ============

/**
 * POST /admin/payments/:id/verify
 * Admin endpoint: Verify payment slip
 */
export async function verifyPaymentHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!id || typeof id !== "string") {
      return res.status(400).json({
        error: "Payment ID is required",
        code: "INVALID_PAYMENT_ID",
      });
    }
    const paymentId = BigInt(id);

    // Validate request body
    const input = VerifyPaymentRequestSchema.parse(req.body);

    // Ensure user is authenticated and is admin
    const multerReq = req as any;
    if (!multerReq.user) {
      return res.status(401).json({
        error: "Unauthorized",
        code: "UNAUTHORIZED",
      });
    }

    const user = multerReq.user as AuthenticatedUser;
    if (user.role !== "admin") {
      return res.status(403).json({
        error: "Forbidden: Admin role required",
        code: "FORBIDDEN",
      });
    }

    const result = await verifyPayment(paymentId, user, input);

    // Queue payment verified email asynchronously (don't wait for it)
    const paymentWithCustomer = await getPaymentWithCustomer(paymentId);
    if (paymentWithCustomer?.customer?.email) {
      queuePaymentVerifiedEmail({
        customerEmail: paymentWithCustomer.customer.email,
        customerName: paymentWithCustomer.customer.fullName,
        orderNumber: paymentWithCustomer.orderNumber,
        orderId: result.orderId,
        paymentId: result.paymentId,
        amount: paymentWithCustomer.amount,
      }).catch((error) => {
        // eslint-disable-next-line no-console
        console.error("Failed to queue payment verified email:", error);
      });
    }

    // Validate and serialize response
    const response = PaymentActionResponseSchema.parse({
      paymentId: result.paymentId,
      orderId: result.orderId,
      state: result.state,
      orderStatus: result.orderStatus,
      message: `Payment verified successfully. Order status updated to ${result.orderStatus}`,
    });

    res.status(200).json(response);
  } catch (error: any) {
    res.status(400).json({
      error: error.message,
      code: "VERIFY_PAYMENT_FAILED",
    });
  }
}

// ============ REJECT PAYMENT (ADMIN) ============

/**
 * POST /admin/payments/:id/reject
 * Admin endpoint: Reject payment slip
 */
export async function rejectPaymentHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!id || typeof id !== "string") {
      return res.status(400).json({
        error: "Payment ID is required",
        code: "INVALID_PAYMENT_ID",
      });
    }
    const paymentId = BigInt(id);

    // Validate request body
    const input = RejectPaymentRequestSchema.parse(req.body);

    // Ensure user is authenticated and is admin
    const multerReq = req as any;
    if (!multerReq.user) {
      return res.status(401).json({
        error: "Unauthorized",
        code: "UNAUTHORIZED",
      });
    }

    const user = multerReq.user as AuthenticatedUser;
    if (user.role !== "admin") {
      return res.status(403).json({
        error: "Forbidden: Admin role required",
        code: "FORBIDDEN",
      });
    }

    const result = await rejectPayment(paymentId, user, input);

    // Queue payment rejected email asynchronously (don't wait for it)
    const paymentWithCustomer = await getPaymentWithCustomer(paymentId);
    if (paymentWithCustomer?.customer?.email) {
      queuePaymentRejectedEmail({
        customerEmail: paymentWithCustomer.customer.email,
        customerName: paymentWithCustomer.customer.fullName,
        orderNumber: paymentWithCustomer.orderNumber,
        orderId: result.orderId,
        paymentId: result.paymentId,
        reason: input.reason,
      }).catch((error) => {
        // eslint-disable-next-line no-console
        console.error("Failed to queue payment rejected email:", error);
      });
    }

    // Validate and serialize response
    const response = PaymentActionResponseSchema.parse({
      paymentId: result.paymentId,
      orderId: result.orderId,
      state: result.state,
      orderStatus: result.orderStatus,
      message: `Payment rejected. Order status reverted to ${result.orderStatus}`,
    });

    res.status(200).json(response);
  } catch (error: any) {
    res.status(400).json({
      error: error.message,
      code: "REJECT_PAYMENT_FAILED",
    });
  }
}

// ============ MULTER MIDDLEWARE EXPORT ============

export { upload };
