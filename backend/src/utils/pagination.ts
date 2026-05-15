/**
 * Pagination utilities for consistent list endpoints
 */

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Calculate skip and take for Prisma query
 */
export function getPaginationParams(page: number, pageSize: number) {
  const skip = (page - 1) * pageSize;
  return { skip, take: pageSize };
}

/**
 * Build paginated response object
 */
export function buildPaginatedResponse<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number,
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / pageSize);
  return {
    items,
    total,
    page,
    pageSize,
    totalPages,
  };
}
