import { getPrisma } from "../db/prisma";
import type { AuthenticatedUser } from "../types";

export interface AuditLogInput {
  actorUserId?: bigint;
  orderId?: bigint;
  paymentId?: bigint;
  action: string;
  meta?: Record<string, unknown>;
}

/**
 * Record an audit log entry
 * Tracks admin actions (create, update, delete, approve, reject, etc.)
 */
export async function recordAuditLog(input: AuditLogInput): Promise<void> {
  const prisma = getPrisma() as any;

  try {
    await prisma.auditLog.create({
      data: {
        actorUserId: input.actorUserId,
        orderId: input.orderId,
        paymentId: input.paymentId,
        action: input.action,
        meta: input.meta || null,
      },
    });
  } catch (err) {
    // Log audit failures but don't fail the main operation
    // eslint-disable-next-line no-console
    console.error("Failed to record audit log:", err);
  }
}

/**
 * Helper to create audit log from authenticated user context
 */
export async function auditAction(
  action: string,
  user: AuthenticatedUser,
  options?: {
    orderId?: bigint;
    paymentId?: bigint;
    meta?: Record<string, unknown>;
  },
): Promise<void> {
  const input: AuditLogInput = {
    actorUserId: user.userId,
    action,
  };

  if (options?.orderId !== undefined) {
    input.orderId = options.orderId;
  }
  if (options?.paymentId !== undefined) {
    input.paymentId = options.paymentId;
  }
  if (options?.meta !== undefined) {
    input.meta = options.meta;
  }

  return recordAuditLog(input);
}
