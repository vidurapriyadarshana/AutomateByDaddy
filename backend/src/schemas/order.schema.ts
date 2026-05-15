/**
 * Order Request/Response Schemas (Zod)
 */

import { z } from "zod";

// ============ ORDER STATUS & CHANNEL ============

export const OrderChannelEnum = z.enum(["web", "whatsapp"]);
export const OrderStatusEnum = z.enum([
  "new",
  "pending_payment",
  "payment_review",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
]);

// ============ CHECKOUT REQUEST SCHEMA ============

export const CheckoutItemSchema = z.object({
  variantId: z.string().transform((val) => BigInt(val)),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
});

export type CheckoutItemSchema = z.infer<typeof CheckoutItemSchema>;

export const CheckoutRequestSchema = z.object({
  // Customer info
  fullName: z.string().min(1, "Full name is required").max(255),
  phone: z.string().min(1, "Phone is required").max(20),
  email: z.string().email("Invalid email").optional(),

  // Delivery address
  addressLine1: z.string().min(1, "Address line 1 is required").max(255),
  addressLine2: z.string().max(255).optional(),
  city: z.string().min(1, "City is required").max(100),
  district: z.string().min(1, "District is required").max(100),
  postalCode: z.string().min(1, "Postal code is required").max(20),
  country: z.string().min(1, "Country is required").max(100),
  deliveryPhone: z.string().min(1, "Delivery phone is required").max(20),

  // Order items
  items: z.array(CheckoutItemSchema).min(1, "At least one item is required"),

  // Payment method
  paymentMethod: z.enum(["cod", "bank_transfer"]),

  // Bank transfer slip (required if paymentMethod is bank_transfer)
  bankTransferSlipUrl: z.string().url().optional(),

  // Customer notes
  notes: z.string().max(500).optional(),
});

export type CheckoutRequestSchema = z.infer<typeof CheckoutRequestSchema>;

// ============ ORDER RESPONSE SCHEMAS ============

export const OrderItemResponseSchema = z.object({
  id: z.bigint(),
  orderId: z.bigint(),
  variantId: z.bigint(),
  quantity: z.number(),
  unitPrice: z.string(), // Decimal as string
  lineTotal: z.string(),
});

export type OrderItemResponseSchema = z.infer<typeof OrderItemResponseSchema>;

export const OrderResponseSchema = z.object({
  id: z.bigint(),
  orderNumber: z.string(),
  customerId: z.bigint(),
  addressId: z.bigint(),
  channel: OrderChannelEnum,
  status: OrderStatusEnum,
  subtotal: z.string(),
  shippingFee: z.string(),
  total: z.string(),
  currency: z.string(),
  customerNote: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type OrderResponseSchema = z.infer<typeof OrderResponseSchema>;

export const OrderDetailResponseSchema = OrderResponseSchema.extend({
  customer: z.object({
    id: z.bigint(),
    fullName: z.string(),
    phone: z.string(),
    email: z.string().nullable(),
  }),
  address: z.object({
    id: z.bigint(),
    line1: z.string(),
    line2: z.string().nullable(),
    city: z.string(),
    district: z.string(),
    postalCode: z.string(),
    country: z.string(),
    phone: z.string(),
  }),
  items: z.array(OrderItemResponseSchema),
  payments: z.array(
    z.object({
      id: z.bigint(),
      method: z.enum(["cod", "bank_transfer", "gateway"]),
      state: z.enum(["pending", "review", "verified", "rejected", "refunded"]),
      amount: z.string(),
      slipUrl: z.string().nullable(),
      createdAt: z.date(),
    }),
  ),
});

export type OrderDetailResponseSchema = z.infer<typeof OrderDetailResponseSchema>;

export const CheckoutResponseSchema = z.object({
  orderNumber: z.string(),
  id: z.bigint(),
  customerId: z.bigint(),
  status: OrderStatusEnum,
  subtotal: z.string(),
  shippingFee: z.string(),
  total: z.string(),
  paymentMethod: z.enum(["cod", "bank_transfer"]),
  message: z.string(),
});

export type CheckoutResponseSchema = z.infer<typeof CheckoutResponseSchema>;

// ============ ADMIN SCHEMAS ============

export const UpdateOrderStatusSchema = z.object({
  status: OrderStatusEnum,
  notes: z.string().optional(),
});

export type UpdateOrderStatusSchema = z.infer<typeof UpdateOrderStatusSchema>;

export const AddOrderNoteSchema = z.object({
  note: z.string().min(1, "Note is required").max(500),
});

export type AddOrderNoteSchema = z.infer<typeof AddOrderNoteSchema>;

// ============ PAGINATION ============

export const OrderListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: OrderStatusEnum.optional(),
  channel: OrderChannelEnum.optional(),
});

export type OrderListQuerySchema = z.infer<typeof OrderListQuerySchema>;

export const PaginatedOrdersResponseSchema = z.object({
  items: z.array(OrderResponseSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
  totalPages: z.number(),
});

export type PaginatedOrdersResponseSchema = z.infer<typeof PaginatedOrdersResponseSchema>;

// ============ PUBLIC STATUS LOOKUP ============

export const OrderStatusLookupRequestSchema = z.object({
  orderNumber: z.string(),
  phone: z.string(), // Verification - must match order's phone
});

export type OrderStatusLookupRequestSchema = z.infer<typeof OrderStatusLookupRequestSchema>;

// ============ ORDER NOTE SCHEMA ============

export const AddNoteRequestSchema = z.object({
  note: z.string().min(1, "Note is required").max(500),
});

export type AddNoteRequestSchema = z.infer<typeof AddNoteRequestSchema>;
