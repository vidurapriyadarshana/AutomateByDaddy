import type { Request, Response } from "express";
import {
  listThreads,
  getThreadMessages,
  sendThreadMessage,
} from "./whatsapp-admin.service";

export async function listThreadsHandler(
  req: Request<unknown, unknown, unknown, { page?: string; pageSize?: string }>,
  res: Response,
) {
  const page = Math.max(1, parseInt(req.query.page ?? "1", 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize ?? "20", 10) || 20));

  const result = await listThreads(page, pageSize);
  res.json(result);
}

export async function getThreadMessagesHandler(
  req: Request<{ id: string }, unknown, unknown, { page?: string; pageSize?: string }>,
  res: Response,
) {
  const threadId = parseInt(req.params.id, 10);
  if (Number.isNaN(threadId)) {
    res.status(400).json({ error: { message: "Invalid thread ID", code: "INVALID_ID" } });
    return;
  }

  const page = Math.max(1, parseInt(req.query.page ?? "1", 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize ?? "50", 10) || 50));

  try {
    const result = await getThreadMessages(threadId, page, pageSize);
    res.json(result);
  } catch {
    res.status(404).json({ error: { message: "Thread not found", code: "NOT_FOUND" } });
  }
}

export async function sendThreadMessageHandler(
  req: Request<{ id: string }, unknown, { message?: string }>,
  res: Response,
) {
  const threadId = parseInt(req.params.id, 10);
  if (Number.isNaN(threadId)) {
    res.status(400).json({ error: { message: "Invalid thread ID", code: "INVALID_ID" } });
    return;
  }

  const { message } = req.body;
  if (!message || typeof message !== "string" || message.trim().length === 0) {
    res.status(400).json({ error: { message: "Message text is required", code: "MISSING_MESSAGE" } });
    return;
  }

  try {
    const result = await sendThreadMessage(threadId, message.trim());
    res.json({ success: true, messageId: result.messageId });
  } catch (err: any) {
    const msg = err.message ?? "Failed to send message";
    if (msg.includes("not ready")) {
      res.status(503).json({ error: { message: msg, code: "WHATSAPP_NOT_READY" } });
    } else if (msg.includes("not found")) {
      res.status(404).json({ error: { message: msg, code: "NOT_FOUND" } });
    } else {
      throw err;
    }
  }
}
