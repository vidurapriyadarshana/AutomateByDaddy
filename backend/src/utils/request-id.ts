import { randomUUID } from "crypto";

export const REQUEST_ID_HEADER = "x-request-id" as const;

export function newRequestId() {
  return randomUUID();
}
