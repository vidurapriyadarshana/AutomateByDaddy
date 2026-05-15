import { describe, it, expect } from "vitest";
import { toDecimal, formatDecimal, isValidPrice, addPrices, multiplyPrice } from "../money";

describe("toDecimal", () => {
  it("returns string unchanged", () => {
    expect(toDecimal("1234.56")).toBe("1234.56");
  });

  it("converts number to string", () => {
    expect(toDecimal(1234.56)).toBe("1234.56");
  });

  it("handles integer number", () => {
    expect(toDecimal(100)).toBe("100");
  });
});

describe("formatDecimal", () => {
  it("returns 0.00 for null", () => {
    expect(formatDecimal(null)).toBe("0.00");
  });

  it("returns 0.00 for undefined", () => {
    expect(formatDecimal(undefined)).toBe("0.00");
  });

  it("formats string to 2 decimal places", () => {
    expect(formatDecimal("1234.5")).toBe("1234.50");
  });

  it("formats string with 2 decimals already", () => {
    expect(formatDecimal("1234.56")).toBe("1234.56");
  });

  it("formats number to 2 decimal places", () => {
    expect(formatDecimal(1234.5)).toBe("1234.50");
  });

  it("handles object with toFixed method", () => {
    const decimalLike = { toFixed: (n: number) => "42.00" };
    expect(formatDecimal(decimalLike)).toBe("42.00");
  });

  it("returns 0.00 for NaN string", () => {
    expect(formatDecimal("not-a-number")).toBe("0.00");
  });

  it("returns 0.00 for unknown type", () => {
    expect(formatDecimal([])).toBe("0.00");
  });
});

describe("isValidPrice", () => {
  it("accepts whole number", () => {
    expect(isValidPrice("100")).toBe(true);
  });

  it("accepts price with 2 decimals", () => {
    expect(isValidPrice("99.99")).toBe(true);
  });

  it("accepts price with 1 decimal", () => {
    expect(isValidPrice("99.5")).toBe(true);
  });

  it("accepts zero", () => {
    expect(isValidPrice("0")).toBe(true);
  });

  it("rejects negative", () => {
    expect(isValidPrice("-10")).toBe(false);
  });

  it("rejects too many decimals", () => {
    expect(isValidPrice("10.123")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(isValidPrice("")).toBe(false);
  });

  it("rejects non-string input", () => {
    expect(isValidPrice(null as any)).toBe(false);
  });

  it("rejects non-numeric string", () => {
    expect(isValidPrice("abc")).toBe(false);
  });
});

describe("addPrices", () => {
  it("adds two string prices", () => {
    expect(addPrices("10.50", "20.50")).toBe("31.00");
  });

  it("adds number and string", () => {
    expect(addPrices(10, "5.99")).toBe("15.99");
  });

  it("adds two numbers", () => {
    expect(addPrices(100, 50)).toBe("150.00");
  });

  it("avoids floating point precision issues", () => {
    expect(addPrices("0.1", "0.2")).toBe("0.30");
  });

  it("handles zero", () => {
    expect(addPrices("0", "0")).toBe("0.00");
  });
});

describe("multiplyPrice", () => {
  it("multiplies string price by quantity", () => {
    expect(multiplyPrice("10.50", 3)).toBe("31.50");
  });

  it("multiplies number price by quantity", () => {
    expect(multiplyPrice(25, 4)).toBe("100.00");
  });

  it("handles fractional quantity", () => {
    expect(multiplyPrice("10.00", 0.5)).toBe("5.00");
  });

  it("handles zero quantity", () => {
    expect(multiplyPrice("50", 0)).toBe("0.00");
  });
});
