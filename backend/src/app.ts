import cors from "cors";
import express from "express";
import swaggerUi from "swagger-ui-express";
import { notFoundHandler, errorHandler } from "./middlewares/error.middleware";
import { requestIdMiddleware } from "./middlewares/request-id.middleware";
import { openapiDocument } from "./openapi";

export function createApp() {
  const app = express();

  app.use(requestIdMiddleware);
  app.use(cors());
  app.use(express.json({ limit: "2mb" }));

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

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
