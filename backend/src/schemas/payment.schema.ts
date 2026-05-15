/**
 * Payment Request/Response Schemas (Zod)
 */

import { z } from "zod";

// ============ PAYMENT METHOD & STATE ENUMS ============

export const PaymentMethodEnum = z.enum(["cod", "bank_transfer", "gateway"]);
export const PaymentStateEnum = z.enum(["pending", "review", "verified", "rejected", "refunded"]);

export type PaymentMethod = z.infer<typeof PaymentMethodEnum>;
export type PaymentState = z.infer<typeof PaymentStateEnum>;

// ============ SLIP UPLOAD REQUEST ============

/**
 * Upload payment slip for bank transfer
 * Public endpoint - customer uploads slip before checkout
 */
export const UploadSlipRequestSchema = z.object({
  orderId: z.string().transform((val) => BigInt(val)),
});

export type UploadSlipRequestSchema = z.infer<typeof UploadSlipRequestSchema>;

/**
 * Response for slip upload
 */
export const SlipUploadResponseSchema = z.object({
  paymentId: z.bigint(),
  slipUrl: z.string(),
  state: PaymentStateEnum,
  message: z.string(),
});

export type SlipUploadResponseSchema = z.infer<typeof SlipUploadResponseSchema>;

// ============ PAYMENT RESPONSE SCHEMA ============

export const PaymentResponseSchema = z.object({
  id: z.bigint(),
  orderId: z.bigint(),
  method: PaymentMethodEnum,
  state: PaymentStateEnum,
  amount: z.string(), // Decimal as string
  currency: z.string(),
  slipUrl: z.string().nullable(),
  gatewayRef: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type PaymentResponseSchema = z.infer<typeof PaymentResponseSchema>;

// ============ ADMIN PAYMENT VERIFICATION/REJECTION ============

export const VerifyPaymentRequestSchema = z.object({
  notes: z.string().optional(),
});

export type VerifyPaymentRequestSchema = z.infer<typeof VerifyPaymentRequestSchema>;

export const RejectPaymentRequestSchema = z.object({
  reason: z.string().min(1, "Rejection reason is required").max(500),
});

export type RejectPaymentRequestSchema = z.infer<typeof RejectPaymentRequestSchema>;

export const PaymentActionResponseSchema = z.object({
  paymentId: z.bigint(),
  orderId: z.bigint(),
  state: PaymentStateEnum,
  orderStatus: z.string(),
  message: z.string(),
});

export type PaymentActionResponseSchema = z.infer<typeof PaymentActionResponseSchema>;

// ============ ADMIN PAYMENT DETAILS ============

export const AdminPaymentDetailResponseSchema = PaymentResponseSchema.extend({
  order: z.object({
    id: z.bigint(),
    orderNumber: z.string(),
    status: z.string(),
    total: z.string(),
    customerName: z.string(),
    customerPhone: z.string(),
  }),
});

export type AdminPaymentDetailResponseSchema = z.infer<typeof AdminPaymentDetailResponseSchema>;
