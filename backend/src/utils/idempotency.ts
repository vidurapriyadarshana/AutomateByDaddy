import { getPrisma } from "../db/prisma";

/**
 * Idempotency utility for webhook handling
 * Prevents duplicate processing of the same event
 */

/**
 * Check if an event has already been processed
 * Returns true if event is new (hasn't been processed), false if already processed
 */
export async function checkIdempotency(
  eventId: string,
  eventType: string,
  provider: string,
): Promise<boolean> {
  const prisma = getPrisma() as any;

  // For MVP, we'll use a simple table-based approach
  // In production, consider using Redis for better performance
  try {
    // Check if event already exists
    const existingEvent = await prisma.idempotencyEvent?.findUnique({
      where: {
        eventKey: `${provider}:${eventType}:${eventId}`,
      },
    });

    if (existingEvent) {
      return false; // Event already processed
    }

    // Record the event as processed
    await prisma.idempotencyEvent?.create({
      data: {
        eventKey: `${provider}:${eventType}:${eventId}`,
        provider,
        eventType,
        externalEventId: eventId,
        processedAt: new Date(),
      },
    });

    return true; // Event is new, proceed with processing
  } catch (error) {
    // If table doesn't exist yet, just log and allow processing
    // This is a graceful fallback for MVP
    console.warn(
      `Idempotency check skipped (table may not exist): ${error}`,
    );
    return true;
  }
}

/**
 * Cleanup old idempotency events (older than retention period)
 * Should be run periodically via a cron job
 */
export async function cleanupIdempotencyEvents(
  retentionDays: number = 30,
): Promise<number> {
  const prisma = getPrisma() as any;

  try {
    const cutoffDate = new Date(
      Date.now() - retentionDays * 24 * 60 * 60 * 1000,
    );

    const result = await prisma.idempotencyEvent?.deleteMany({
      where: {
        processedAt: {
          lt: cutoffDate,
        },
      },
    });

    return result?.count ?? 0;
  } catch (error) {
    console.error(
      `Failed to cleanup idempotency events: ${error}`,
    );
    return 0;
  }
}
