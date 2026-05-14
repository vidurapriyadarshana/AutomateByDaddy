import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { ZodTypeAny } from "zod";
import type { RequestParts } from "../types";

export function validate<TSchema extends ZodTypeAny>(
  part: RequestParts,
  schema: TSchema,
): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    // If parsing fails, it will be caught by the error middleware.
    ;(req as any)[part] = schema.parse((req as any)[part]);
    next();
  };
}
