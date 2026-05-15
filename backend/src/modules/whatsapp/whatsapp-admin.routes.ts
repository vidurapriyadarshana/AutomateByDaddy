import { Router } from "express";
import type { RequestHandler } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import {
  listThreadsHandler,
  getThreadMessagesHandler,
  sendThreadMessageHandler,
} from "./whatsapp-admin.controller";

const router = Router();

// All admin WhatsApp routes require admin auth
router.use(requireAuth("admin"));

router.get("/threads", listThreadsHandler as unknown as RequestHandler);

router.get(
  "/threads/:id/messages",
  getThreadMessagesHandler as unknown as RequestHandler,
);

router.post(
  "/threads/:id/send",
  sendThreadMessageHandler as unknown as RequestHandler,
);

export default router;
