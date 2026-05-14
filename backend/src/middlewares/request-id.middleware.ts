import type { NextFunction, Request, Response } from "express";
import { newRequestId, REQUEST_ID_HEADER } from "../utils/request-id";

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const incoming = req.header(REQUEST_ID_HEADER);
  const requestId = incoming && incoming.trim().length > 0 ? incoming : newRequestId();

  res.setHeader(REQUEST_ID_HEADER, requestId);
  res.locals.requestId = requestId;
  next();
}
