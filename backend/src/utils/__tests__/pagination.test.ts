import { describe, it, expect } from "vitest";
import { getPaginationParams, buildPaginatedResponse } from "../pagination";

describe("getPaginationParams", () => {
  it("returns skip=0 for page 1", () => {
    expect(getPaginationParams(1, 20)).toEqual({ skip: 0, take: 20 });
  });

  it("returns skip=20 for page 2", () => {
    expect(getPaginationParams(2, 20)).toEqual({ skip: 20, take: 20 });
  });

  it("handles pageSize=1", () => {
    expect(getPaginationParams(3, 1)).toEqual({ skip: 2, take: 1 });
  });

  it("handles pageSize=100", () => {
    expect(getPaginationParams(1, 100)).toEqual({ skip: 0, take: 100 });
  });
});

describe("buildPaginatedResponse", () => {
  const items = [{ id: 1 }, { id: 2 }];

  it("builds response with correct structure", () => {
    const result = buildPaginatedResponse(items, 10, 1, 20);
    expect(result).toEqual({
      items,
      total: 10,
      page: 1,
      pageSize: 20,
      totalPages: 1,
    });
  });

  it("calculates totalPages correctly (exact division)", () => {
    const result = buildPaginatedResponse(items, 20, 1, 10);
    expect(result.totalPages).toBe(2);
  });

  it("calculates totalPages correctly (rounded up)", () => {
    const result = buildPaginatedResponse(items, 21, 1, 10);
    expect(result.totalPages).toBe(3);
  });

  it("handles empty items", () => {
    const result = buildPaginatedResponse([], 0, 1, 20);
    expect(result.totalPages).toBe(0);
  });

  it("handles single page", () => {
    const result = buildPaginatedResponse([{ id: 1 }], 1, 1, 20);
    expect(result.totalPages).toBe(1);
  });
});
