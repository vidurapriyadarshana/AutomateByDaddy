/**
 * API Response and Error Types
 */

export type ApiErrorBody = {
  error: {
    message: string;
    code?: string | undefined;
    requestId?: string | undefined;
    details?: unknown;
  };
};

export type ApiResponse<T> = {
  data: T;
  requestId?: string | undefined;
};
