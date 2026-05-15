import { getPrisma } from "../../db/prisma";
import { getPaginationParams, buildPaginatedResponse } from "../../utils/pagination";
import { addPrices, multiplyPrice, formatDecimal } from "../../utils/money";
import {
  getOrCreateCustomer,
  createAddress,
  getDefaultAddressForCustomer,
} from "../customers/customer.service";
import {
  checkAndReserveStock,
  getVariantById,
  updateVariantStock,
} from "../products/product.service";
import type {
  CheckoutRequestSchema,
  UpdateOrderStatusSchema,
} from "../../schemas/order.schema";

// ============ ORDER NUMBERING ============

/**
 * Generate a human-friendly, unique, non-guessable order number
 * Format: ORD-YYYYMMDD-XXXXX (e.g., ORD-20260515-AB12C)
 */
export async function generateOrderNumber(): Promise<string> {
  const prisma = getPrisma() as any;

  const now = new Date();
  const isoString = now.toISOString();
  const datePart = isoString.split("T")[0] || "";
  const dateStr = datePart.replace(/-/g, "");

  // Get count of orders created today
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

  const countToday = await prisma.salesOrder.count({
    where: {
      createdAt: {
        gte: startOfDay,
        lt: endOfDay,
      },
    },
  });

  // Generate random suffix
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let suffix = "";
  for (let i = 0; i < 5; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  const orderNumber = `ORD-${dateStr}-${suffix}`;

  // Verify uniqueness (extremely unlikely to collide but let's be safe)
  const existing = await prisma.salesOrder.findUnique({
    where: { orderNumber },
  });

  if (existing) {
    // Recursive call if collision (won't happen in practice)
    return generateOrderNumber();
  }

  return orderNumber;
}

// ============ CHECKOUT LOGIC ============

/**
 * Process a checkout request and create an order
 */
export async function processCheckout(input: CheckoutRequestSchema) {
  const prisma = getPrisma() as any;

  // 1. Get or create customer
  const customer = await getOrCreateCustomer(input.fullName, input.phone, input.email);

  // 2. Create or use delivery address
  const address = await createAddress(customer.id, {
    line1: input.addressLine1,
    line2: input.addressLine2,
    city: input.city,
    district: input.district,
    postalCode: input.postalCode,
    country: input.country,
    phone: input.deliveryPhone,
    isDefault: false,
  });

  // 3. Verify and calculate order items
  let subtotal = "0.00";
  const orderItems: Array<{
    variantId: bigint;
    quantity: number;
    unitPrice: string;
    lineTotal: string;
  }> = [];

  for (const item of input.items) {
    const variant = await getVariantById(item.variantId);

    if (!variant) {
      throw new Error(`Variant ${item.variantId} not found`);
    }

    if (!variant.active) {
      throw new Error(`Variant ${item.variantId} is inactive`);
    }

    // Check stock
    const hasStock = await checkAndReserveStock(item.variantId, item.quantity);
    if (!hasStock) {
      throw new Error(
        `Insufficient stock for variant ${variant.sku}. Available: check inventory`,
      );
    }

    const lineTotal = multiplyPrice(variant.price, item.quantity);
    subtotal = addPrices(subtotal, lineTotal);

    orderItems.push({
      variantId: item.variantId,
      quantity: item.quantity,
      unitPrice: variant.price,
      lineTotal,
    });
  }

  // 4. Calculate shipping fee (hardcoded for MVP, could be dynamic later)
  const shippingFee = "250.00";
  const total = addPrices(subtotal, shippingFee);

  // 5. Generate order number
  const orderNumber = await generateOrderNumber();

  // 6. Create order with items in a transaction
  const order = await prisma.salesOrder.create({
    data: {
      orderNumber,
      customerId: customer.id,
      addressId: address.id,
      channel: "web",
      status: "new",
      subtotal,
      shippingFee,
      total,
      currency: "LKR",
      customerNote: input.notes || null,
      orderItems: {
        create: orderItems,
      },
    },
  });

  // 7. Create payment intent
  const payment = await prisma.payment.create({
    data: {
      orderId: order.id,
      method: input.paymentMethod,
      state: "pending",
      amount: total,
      currency: "LKR",
      slipUrl: input.paymentMethod === "bank_transfer" ? input.bankTransferSlipUrl : null,
    },
  });

  // 8. Update order status based on payment method
  let updatedOrder = order;
  if (input.paymentMethod === "bank_transfer") {
    if (input.bankTransferSlipUrl) {
      // If slip is provided, move to payment_review
      updatedOrder = await prisma.salesOrder.update({
        where: { id: order.id },
        data: { status: "payment_review" },
      });
    } else {
      // If no slip, move to pending_payment
      updatedOrder = await prisma.salesOrder.update({
        where: { id: order.id },
        data: { status: "pending_payment" },
      });
    }
  } else if (input.paymentMethod === "cod") {
    // COD orders move to pending_payment (admin will confirm)
    updatedOrder = await prisma.salesOrder.update({
      where: { id: order.id },
      data: { status: "pending_payment" },
    });
  }

  return {
    orderId: updatedOrder.id,
    orderNumber: updatedOrder.orderNumber,
    customerId: customer.id,
    status: updatedOrder.status,
    subtotal: updatedOrder.subtotal,
    shippingFee: updatedOrder.shippingFee,
    total: updatedOrder.total,
    paymentMethod: input.paymentMethod,
  };
}

// ============ ORDER QUERIES ============

/**
 * Get order by order number
 */
export async function getOrderByNumber(orderNumber: string) {
  const prisma = getPrisma() as any;

  const order = await prisma.salesOrder.findUnique({
    where: { orderNumber },
    include: {
      customer: {
        select: {
          id: true,
          fullName: true,
          phone: true,
          email: true,
        },
      },
      address: true,
      orderItems: true,
      payments: true,
    },
  });

  return order ? serializeOrder(order) : null;
}

/**
 * Get order by ID (admin view)
 */
export async function getOrderById(orderId: bigint) {
  const prisma = getPrisma() as any;

  const order = await prisma.salesOrder.findUnique({
    where: { id: orderId },
    include: {
      customer: {
        select: {
          id: true,
          fullName: true,
          phone: true,
          email: true,
        },
      },
      address: true,
      orderItems: true,
      payments: true,
    },
  });

  return order ? serializeOrder(order) : null;
}

/**
 * List orders for admin with optional filtering
 */
export async function listOrders(
  page: number,
  pageSize: number,
  status?: string,
  channel?: string,
) {
  const prisma = getPrisma() as any;
  const { skip, take } = getPaginationParams(page, pageSize);

  const whereClause: any = {};
  if (status) whereClause.status = status;
  if (channel) whereClause.channel = channel;

  const [orders, total] = await Promise.all([
    prisma.salesOrder.findMany({
      where: whereClause,
      include: {
        customer: {
          select: {
            fullName: true,
            phone: true,
          },
        },
      },
      skip,
      take,
      orderBy: { createdAt: "desc" },
    }),
    prisma.salesOrder.count({
      where: whereClause,
    }),
  ]);

  // Serialize prices
  const serialized = orders.map((order: any) => ({
    ...order,
    subtotal: formatDecimal(order.subtotal),
    shippingFee: formatDecimal(order.shippingFee),
    total: formatDecimal(order.total),
  }));

  return buildPaginatedResponse(serialized, total, page, pageSize);
}

/**
 * List orders for a customer (public - limited info)
 */
export async function listOrdersByCustomerPhone(phone: string, page: number, pageSize: number) {
  const prisma = getPrisma() as any;
  const { skip, take } = getPaginationParams(page, pageSize);

  const [orders, total] = await Promise.all([
    prisma.salesOrder.findMany({
      where: {
        customer: {
          phone,
        },
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        createdAt: true,
      },
      skip,
      take,
      orderBy: { createdAt: "desc" },
    }),
    prisma.salesOrder.count({
      where: {
        customer: {
          phone,
        },
      },
    }),
  ]);

  const serialized = orders.map((order: any) => ({
    ...order,
    total: formatDecimal(order.total),
  }));

  return buildPaginatedResponse(serialized, total, page, pageSize);
}

// ============ ORDER STATUS TRANSITIONS ============

/**
 * Valid status transitions map
 */
const STATUS_TRANSITIONS: Record<string, string[]> = {
  new: ["pending_payment", "cancelled"],
  pending_payment: ["payment_review", "cancelled"],
  payment_review: ["confirmed", "rejected", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered", "cancelled"],
  delivered: ["refunded"],
  cancelled: [],
  refunded: [],
};

/**
 * Check if a status transition is allowed
 */
export function isValidStatusTransition(from: string, to: string): boolean {
  const allowedTransitions = STATUS_TRANSITIONS[from] || [];
  return allowedTransitions.includes(to);
}

/**
 * Update order status with validation
 */
export async function updateOrderStatus(
  orderId: bigint,
  newStatus: string,
  notes?: string,
) {
  const prisma = getPrisma() as any;

  const order = await prisma.salesOrder.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  if (!isValidStatusTransition(order.status, newStatus)) {
    throw new Error(
      `Cannot transition from ${order.status} to ${newStatus}`,
    );
  }

  const updatedOrder = await prisma.salesOrder.update({
    where: { id: orderId },
    data: { status: newStatus },
  });

  // Log the status change
  if (notes) {
    // This would be paired with auditAction in controller
    // For now we just record the status change
  }

  return updatedOrder;
}

// ============ HELPERS ============

/**
 * Get order details formatted for email sending
 */
export async function getOrderDetailsForEmail(orderId: bigint) {
  const prisma = getPrisma() as any;

  const order = await prisma.salesOrder.findUnique({
    where: { id: orderId },
    include: {
      orderItems: {
        include: {
          variant: true,
        },
      },
      address: true,
      customer: true,
    },
  });

  if (!order) {
    return null;
  }

  return {
    items: order.orderItems.map((item: any) => ({
      name: `${item.variant.size} - ${item.variant.color}`,
      quantity: item.quantity,
      price: formatDecimal(item.unitPrice),
    })),
    deliveryAddress: `${order.address.line1}${order.address.line2 ? ", " + order.address.line2 : ""}, ${order.address.city}, ${order.address.district}, ${order.address.postalCode}, ${order.address.country}`,
  };
}

/**
 * Serialize order with formatted prices
 */
function serializeOrder(order: any) {
  return {
    ...order,
    id: order.id,
    subtotal: formatDecimal(order.subtotal),
    shippingFee: formatDecimal(order.shippingFee),
    total: formatDecimal(order.total),
    orderItems: order.orderItems.map((item: any) => ({
      ...item,
      unitPrice: formatDecimal(item.unitPrice),
      lineTotal: formatDecimal(item.lineTotal),
    })),
    payments: order.payments?.map((payment: any) => ({
      ...payment,
      amount: formatDecimal(payment.amount),
    })),
  };
}
