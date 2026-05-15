import type { Request, Response } from "express";
import {
  processCheckout,
  getOrderByNumber,
  getOrderById,
  listOrders,
  listOrdersByCustomerPhone,
  updateOrderStatus,
  isValidStatusTransition,
  getOrderDetailsForEmail,
} from "./order.service";
import { auditAction } from "../../utils/audit-log";
import { queueOrderConfirmationEmail, queueOrderStatusUpdateEmail } from "../messaging/messaging.service";
import type { AuthenticatedUser } from "../../types";
import type {
  CheckoutRequestSchema,
  OrderStatusLookupRequestSchema,
  UpdateOrderStatusSchema,
  OrderListQuerySchema,
} from "../../schemas/order.schema";

// ============ PUBLIC HANDLERS ============

/**
 * POST /checkout
 * Public checkout endpoint - create order
 */
export async function checkoutHandler(
  req: Request<unknown, unknown, CheckoutRequestSchema>,
  res: Response,
) {
  try {
    const result = await processCheckout(req.body);

    // Queue order confirmation email asynchronously (don't wait for it)
    if (req.body.email) {
      const emailDetails = await getOrderDetailsForEmail(result.orderId);
      if (emailDetails) {
        queueOrderConfirmationEmail({
          customerEmail: req.body.email,
          customerName: req.body.fullName,
          orderNumber: result.orderNumber,
          orderId: result.orderId,
          total: result.total,
          items: emailDetails.items,
          deliveryAddress: emailDetails.deliveryAddress,
          paymentMethod: result.paymentMethod,
        }).catch((error) => {
          // eslint-disable-next-line no-console
          console.error("Failed to queue order confirmation email:", error);
        });
      }
    }

    res.status(201).json({
      orderNumber: result.orderNumber,
      id: result.orderId,
      customerId: result.customerId,
      status: result.status,
      subtotal: result.subtotal,
      shippingFee: result.shippingFee,
      total: result.total,
      paymentMethod: result.paymentMethod,
      message:
        result.status === "pending_payment"
          ? "Order created. Awaiting payment confirmation."
          : "Order created. Payment under review.",
    });
  } catch (err: any) {
    const message = err.message || "Checkout failed";

    if (message.includes("not found")) {
      res.status(404).json({
        error: {
          message,
          code: "NOT_FOUND",
        },
      });
    } else if (message.includes("Insufficient stock")) {
      res.status(409).json({
        error: {
          message,
          code: "OUT_OF_STOCK",
        },
      });
    } else if (message.includes("inactive")) {
      res.status(400).json({
        error: {
          message,
          code: "INVALID_REQUEST",
        },
      });
    } else {
      throw err;
    }
  }
}

/**
 * POST /orders/lookup
 * Public order status lookup (requires orderNumber and phone verification)
 */
export async function orderStatusLookupHandler(
  req: Request<unknown, unknown, OrderStatusLookupRequestSchema>,
  res: Response,
) {
  const { orderNumber, phone } = req.body;

  const order = await getOrderByNumber(orderNumber);

  if (!order) {
    res.status(404).json({
      error: {
        message: "Order not found",
        code: "NOT_FOUND",
      },
    });
    return;
  }

  // Verify phone matches (security check - only show orders to customer)
  if (order.customer.phone !== phone) {
    res.status(403).json({
      error: {
        message: "Phone number does not match order",
        code: "FORBIDDEN",
      },
    });
    return;
  }

  // Return limited info for public lookup
  res.json({
    orderNumber: order.orderNumber,
    status: order.status,
    total: order.total,
    createdAt: order.createdAt,
    customerName: order.customer.fullName,
  });
}

/**
 * GET /orders/:orderNumber
 * Public get order status (limited info, no verification)
 */
export async function publicGetOrderHandler(
  req: Request<{ orderNumber: string }>,
  res: Response,
) {
  const order = await getOrderByNumber(req.params.orderNumber);

  if (!order) {
    res.status(404).json({
      error: {
        message: "Order not found",
        code: "NOT_FOUND",
      },
    });
    return;
  }

  // Return limited info (no customer email, addresses, etc.)
  res.json({
    orderNumber: order.orderNumber,
    status: order.status,
    total: order.total,
    createdAt: order.createdAt,
  });
}

// ============ ADMIN HANDLERS ============

/**
 * GET /admin/orders
 * List orders with optional filtering by status or channel
 */
export async function listOrdersHandler(
  req: Request<unknown, unknown, unknown, OrderListQuerySchema>,
  res: Response,
) {
  const { page, pageSize, status, channel } = req.query as any;
  const result = await listOrders(page, pageSize, status, channel);
  res.json(result);
}

/**
 * GET /admin/orders/:id
 * Get order details (admin view - full info)
 */
export async function getOrderHandler(req: Request<{ id: string }>, res: Response) {
  const orderId = BigInt(req.params.id);

  try {
    const order = await getOrderById(orderId);

    if (!order) {
      res.status(404).json({
        error: {
          message: "Order not found",
          code: "NOT_FOUND",
        },
      });
      return;
    }

    res.json(order);
  } catch (err) {
    res.status(404).json({
      error: {
        message: "Order not found",
        code: "NOT_FOUND",
      },
    });
  }
}

/**
 * PATCH /admin/orders/:id/status
 * Update order status (with validation)
 */
export async function updateOrderStatusHandler(
  req: Request<{ id: string }, unknown, UpdateOrderStatusSchema>,
  res: Response,
) {
  const user = (req as any).user as AuthenticatedUser;
  const orderId = BigInt(req.params.id);
  const { status, notes } = req.body;

  try {
    // Get current order to check valid transition
    const currentOrder = await getOrderById(orderId);

    if (!currentOrder) {
      res.status(404).json({
        error: {
          message: "Order not found",
          code: "NOT_FOUND",
        },
      });
      return;
    }

    // Validate transition
    if (!isValidStatusTransition(currentOrder.status, status)) {
      res.status(400).json({
        error: {
          message: `Cannot transition from ${currentOrder.status} to ${status}`,
          code: "INVALID_TRANSITION",
        },
      });
      return;
    }

    // Update status
    const updatedOrder = await updateOrderStatus(orderId, status, notes);

    // Audit log
    await auditAction("order_status_updated", user, {
      meta: {
        orderId: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        fromStatus: currentOrder.status,
        toStatus: status,
        notes,
      },
    });

    // Queue status update email asynchronously (don't wait for it)
    if (currentOrder.customer?.email) {
      const statusMessage = getStatusUpdateMessage(status);
      queueOrderStatusUpdateEmail({
        customerEmail: currentOrder.customer.email,
        customerName: currentOrder.customer.fullName,
        orderNumber: currentOrder.orderNumber,
        orderId: orderId,
        previousStatus: currentOrder.status,
        newStatus: status,
        statusMessage,
      }).catch((error) => {
        // eslint-disable-next-line no-console
        console.error("Failed to queue order status update email:", error);
      });
    }

    res.json({
      id: updatedOrder.id,
      orderNumber: updatedOrder.orderNumber,
      status: updatedOrder.status,
      message: `Order status updated to ${status}`,
    });
  } catch (err: any) {
    if (err.message.includes("not found")) {
      res.status(404).json({
        error: {
          message: "Order not found",
          code: "NOT_FOUND",
        },
      });
    } else {
      throw err;
    }
  }
}

/**
 * Helper function to generate status update messages
 */
function getStatusUpdateMessage(status: string): string {
  const messages: Record<string, string> = {
    new: "Your order has been received.",
    pending_payment: "Awaiting payment confirmation.",
    payment_review: "Your payment is under review.",
    confirmed: "Your order has been confirmed. It will be processed soon.",
    processing: "Your order is being processed and will ship soon.",
    shipped: "Your order has been shipped! Track your package to see the delivery status.",
    delivered: "Your order has been delivered. Thank you for your purchase!",
    cancelled: "Your order has been cancelled.",
    refunded: "Your order has been refunded. The amount will be credited back.",
  };

  return messages[status] || `Order status updated to ${status}`;
}

/**
 * POST /admin/orders/:id/notes
 * Add a note to an order (could be extended for internal notes)
 */
export async function addOrderNoteHandler(
  req: Request<{ id: string }, unknown, { note: string }>,
  res: Response,
) {
  const user = (req as any).user as AuthenticatedUser;
  const orderId = BigInt(req.params.id);
  const { note } = req.body;

  try {
    const order = await getOrderById(orderId);

    if (!order) {
      res.status(404).json({
        error: {
          message: "Order not found",
          code: "NOT_FOUND",
        },
      });
      return;
    }

    // Audit log the note (internal use)
    await auditAction("order_note_added", user, {
      orderId,
      meta: {
        note,
        orderNumber: order.orderNumber,
      },
    });

    res.json({
      message: "Note added",
      id: order.id,
    });
  } catch (err) {
    res.status(404).json({
      error: {
        message: "Order not found",
        code: "NOT_FOUND",
      },
    });
  }
}
