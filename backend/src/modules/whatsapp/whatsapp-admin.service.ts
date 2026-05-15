import { getPrisma } from "../../db/prisma";
import { sendWhatsAppMessage, isWhatsAppReady } from "../../config/whatsapp.config";
import { buildPaginatedResponse, getPaginationParams } from "../../utils/pagination";
import type { PaginatedResponse } from "../../utils/pagination";

interface ThreadListItem {
  id: number;
  customerId: number;
  customerName: string;
  customerPhone: string;
  lastMessage: { body: string; direction: "in" | "out"; createdAt: string } | null;
  channel: string;
  updatedAt: string;
}

interface ChatMessage {
  id: number;
  threadId: number;
  direction: "in" | "out";
  body: string;
  mediaUrl: string | null;
  providerMessageId: string | null;
  createdAt: string;
}

function cleanPhone(raw: string): string {
  return raw.replace(/@c\.us$/, "").replace(/@g\.us$/, "");
}

export async function listThreads(
  page: number,
  pageSize: number,
): Promise<PaginatedResponse<ThreadListItem>> {
  const prisma = getPrisma() as any;

  const total = await prisma.messageThread.count();
  const { skip, take } = getPaginationParams(page, pageSize);

  const threads = await prisma.messageThread.findMany({
    skip,
    take,
    include: {
      customer: { select: { id: true, fullName: true, phone: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { lastMessageAt: "desc" },
  });

  const items: ThreadListItem[] = threads.map((t: any) => {
    const last = t.messages?.[0] ?? null;
    return {
      id: Number(t.id),
      customerId: Number(t.customerId),
      customerName: t.customer.fullName,
      customerPhone: t.customer.phone,
      lastMessage: last
        ? {
            body: last.body,
            direction: last.direction,
            createdAt: last.createdAt.toISOString(),
          }
        : null,
      channel: t.channel,
      updatedAt: (t.lastMessageAt ?? t.createdAt).toISOString(),
    };
  });

  return buildPaginatedResponse(items, total, page, pageSize);
}

export async function getThreadMessages(
  threadId: number,
  page: number,
  pageSize: number,
): Promise<PaginatedResponse<ChatMessage>> {
  const prisma = getPrisma() as any;

  const total = await prisma.message.count({ where: { threadId } });
  const { skip, take } = getPaginationParams(page, pageSize);

  const messages = await prisma.message.findMany({
    where: { threadId },
    orderBy: { createdAt: "asc" },
    skip,
    take,
  });

  const items: ChatMessage[] = messages.map((m: any) => ({
    id: Number(m.id),
    threadId: Number(m.threadId),
    direction: m.direction,
    body: m.body,
    mediaUrl: m.mediaUrl ?? null,
    providerMessageId: m.providerMessageId ?? null,
    createdAt: m.createdAt.toISOString(),
  }));

  return buildPaginatedResponse(items, total, page, pageSize);
}

export async function sendThreadMessage(
  threadId: number,
  text: string,
): Promise<{ messageId: string }> {
  const prisma = getPrisma() as any;

  const thread = await prisma.messageThread.findUnique({
    where: { id: threadId },
    include: { customer: true },
  });

  if (!thread) {
    throw new Error("Thread not found");
  }

  if (!isWhatsAppReady()) {
    throw new Error("WhatsApp client is not ready");
  }

  const waId = thread.externalThreadId;
  const messageId = await sendWhatsAppMessage(waId, text);

  await prisma.message.create({
    data: {
      threadId,
      direction: "out",
      body: text,
      providerMessageId: messageId,
    },
  });

  await prisma.messageThread.update({
    where: { id: threadId },
    data: { lastMessageAt: new Date() },
  });

  return { messageId };
}
