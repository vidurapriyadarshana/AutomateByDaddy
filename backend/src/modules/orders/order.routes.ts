import { Router } from "express";
import type { RequestHandler } from "express";
import { validate } from "../../middlewares/validate.middleware";
import { requireAuth } from "../../middlewares/auth.middleware";
import {
  CheckoutRequestSchema,
  OrderStatusLookupRequestSchema,
  UpdateOrderStatusSchema,
  OrderListQuerySchema,
  AddNoteRequestSchema,
} from "../../schemas/order.schema";
import {
  checkoutHandler,
  orderStatusLookupHandler,
  publicGetOrderHandler,
  listOrdersHandler,
  getOrderHandler,
  updateOrderStatusHandler,
  addOrderNoteHandler,
} from "./order.controller";

const router = Router();

// ============ PUBLIC CHECKOUT ROUTES ============

/**
 * POST /checkout
 * Public checkout endpoint
 */
router.post(
  "/checkout",
  validate("body", CheckoutRequestSchema),
  checkoutHandler as unknown as RequestHandler,
);

/**
 * POST /orders/lookup
 * Public order status lookup with phone verification
 */
router.post(
  "/lookup",
  validate("body", OrderStatusLookupRequestSchema),
  orderStatusLookupHandler as unknown as RequestHandler,
);

/**
 * GET /orders/:orderNumber
 * Public get order (limited info, no verification)
 */
router.get("/:orderNumber", publicGetOrderHandler as unknown as RequestHandler);

// ============ ADMIN ORDER ROUTES ============

/**
 * GET /admin/orders
 * List orders with optional filtering
 */
router.get(
  "/",
  requireAuth("admin"),
  validate("query", OrderListQuerySchema),
  listOrdersHandler as unknown as RequestHandler,
);

/**
 * GET /admin/orders/:id
 * Get order details
 */
router.get("/:id", requireAuth("admin"), getOrderHandler as unknown as RequestHandler);

/**
 * PATCH /admin/orders/:id/status
 * Update order status
 */
router.patch(
  "/:id/status",
  requireAuth("admin"),
  validate("body", UpdateOrderStatusSchema),
  updateOrderStatusHandler as unknown as RequestHandler,
);

/**
 * POST /admin/orders/:id/notes
 * Add note to order
 */
router.post(
  "/:id/notes",
  requireAuth("admin"),
  validate("body", AddNoteRequestSchema),
  addOrderNoteHandler as unknown as RequestHandler,
);

export default router;
