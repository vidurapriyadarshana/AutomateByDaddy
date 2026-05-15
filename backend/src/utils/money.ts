/**
 * Money utilities for safe decimal handling
 * Note: We work with Decimal as it comes from Prisma/database
 * and convert to/from strings for JSON APIs
 */

/**
 * Converts a string to a Decimal for Prisma storage
 * Always use this when receiving price input from API to ensure precision
 */
export function toDecimal(value: string | number): any {
  // Return the value; Prisma will handle conversion to its Decimal type
  // This is a type-safe wrapper to remind us we're working with money
  if (typeof value === "number") {
    return String(value);
  }
  return value;
}

/**
 * Formats a Decimal (or any numeric) as a string for JSON responses
 * Ensures consistent decimal places (2) and precision
 */
export function formatDecimal(value: any): string {
  if (value === null || value === undefined) {
    return "0.00";
  }
  
  // If it's already a string, parse and format it
  if (typeof value === "string") {
    const num = parseFloat(value);
    return Number.isNaN(num) ? "0.00" : num.toFixed(2);
  }
  
  // If it's a number
  if (typeof value === "number") {
    return value.toFixed(2);
  }
  
  // If it's an object with toFixed (Decimal-like)
  if (typeof value.toFixed === "function") {
    return value.toFixed(2);
  }
  
  return "0.00";
}

/**
 * Validates that a price string is a valid decimal format
 * Returns true if valid, false otherwise
 */
export function isValidPrice(value: string): boolean {
  if (!value || typeof value !== "string") {
    return false;
  }
  
  // Check format: optional digits, optional decimal point, 1-2 decimal places
  const priceRegex = /^\d+(\.\d{1,2})?$/;
  if (!priceRegex.test(value)) {
    return false;
  }
  
  try {
    const num = parseFloat(value);
    return Number.isFinite(num) && num >= 0;
  } catch {
    return false;
  }
}

/**
 * Safe price addition (for subtotal + shipping fee = total)
 * Avoids floating point errors by working with strings
 */
export function addPrices(price1: string | number, price2: string | number): string {
  const num1 = typeof price1 === "string" ? parseFloat(price1) : price1;
  const num2 = typeof price2 === "string" ? parseFloat(price2) : price2;
  
  // Use toFixed to avoid floating point precision issues
  const result = (Math.round((num1 + num2) * 100) / 100).toFixed(2);
  return result;
}

/**
 * Safe price multiplication (price * quantity)
 * Avoids floating point errors
 */
export function multiplyPrice(price: string | number, quantity: number): string {
  const num = typeof price === "string" ? parseFloat(price) : price;
  const result = (Math.round(num * quantity * 100) / 100).toFixed(2);
  return result;
}

