import cors from "cors";
import express from "express";
import path from "path";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import { notFoundHandler, errorHandler } from "./middlewares/error.middleware";
import { requestIdMiddleware } from "./middlewares/request-id.middleware";
import { attachAuth } from "./middlewares/auth.middleware";
import { openapiDocument } from "./openapi";
import { morganStream } from "./config/logger.config";
import authRoutes from "./modules/auth/auth.routes";
import productRoutes from "./modules/products/product.routes";
import customerRoutes from "./modules/customers/customer.routes";
import orderRoutes from "./modules/orders/order.routes";
import paymentRoutes from "./modules/payments/payment.routes";
import whatsappWebhookRoutes from "./modules/webhooks/whatsapp.routes";
import whatsappAdminRoutes from "./modules/whatsapp/whatsapp-admin.routes";

export function createApp() {
  const app = express();

  app.use(requestIdMiddleware);
  app.use(morgan("short", { stream: morganStream }));
  app.use(cors());
  app.use(express.json({ limit: "2mb" }));

  // Serve uploaded files (slips, etc.)
  app.use("/uploads", express.static(path.join(process.cwd(), "backend", "uploads")));

  // Attach auth user if token provided (optional auth)
  app.use(attachAuth());

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.get("/version", (_req, res) => {
    res.json({
      name: "backend",
      env: process.env["NODE_ENV"] ?? "development",
    });
  });

  app.get("/openapi.json", (_req, res) => {
    res.json(openapiDocument);
  });

  app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapiDocument));

  // Auth routes
  app.use("/auth", authRoutes);

  // Product routes (public + admin)
  app.use("/products", productRoutes);

  // Customer routes (admin only)
  app.use("/admin/customers", customerRoutes);

  // Order routes (public checkout + admin)
  app.use("/orders", orderRoutes);

  // Payment routes (public + admin)
  app.use("/payments", paymentRoutes);

  // WhatsApp webhook routes
  app.use("/webhooks/whatsapp", whatsappWebhookRoutes);

  // WhatsApp admin routes (threads, messages, send)
  app.use("/admin/whatsapp", whatsappAdminRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
