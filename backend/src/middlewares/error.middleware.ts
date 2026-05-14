import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import type { ApiErrorBody } from "../types";

function getRequestId(res: Response) {
  const v = res.locals.requestId;
  return typeof v === "string" ? v : undefined;
}

export function notFoundHandler(_req: Request, res: Response) {
  const requestId = getRequestId(res);
  const body: ApiErrorBody = {
    error: { message: "Not found", code: "NOT_FOUND", ...(requestId && { requestId }) },
  };
  res.status(404).json(body);
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof z.ZodError) {
    const requestId = getRequestId(res);
    const body: ApiErrorBody = {
      error: {
        message: "Validation error",
        code: "VALIDATION_ERROR",
        ...(requestId && { requestId }),
        details: err.flatten(),
      },
    };
    res.status(400).json(body);
    return;
  }

  // eslint-disable-next-line no-console
  console.error(err);

  const requestId = getRequestId(res);
  const body: ApiErrorBody = {
    error: { message: "Internal server error", code: "INTERNAL", ...(requestId && { requestId }) },
  };
  res.status(500).json(body);
}
