/**
 * Product and Variant Request/Response Schemas (Zod)
 */

import { z } from "zod";

// ============ PRODUCT SCHEMAS ============

export const CreateProductSchema = z.object({
  name: z.string().min(1, "Product name is required").max(255),
  description: z.string().optional(),
  images: z.array(z.string().url()).optional(),
  active: z.boolean().default(true),
});

export type CreateProductSchema = z.infer<typeof CreateProductSchema>;

export const UpdateProductSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  images: z.array(z.string().url()).optional(),
  active: z.boolean().optional(),
});

export type UpdateProductSchema = z.infer<typeof UpdateProductSchema>;

export const ProductResponseSchema = z.object({
  id: z.bigint(),
  name: z.string(),
  description: z.string().nullable(),
  images: z.array(z.string()).nullable(),
  active: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ProductResponseSchema = z.infer<typeof ProductResponseSchema>;

export const ProductListResponseSchema = z.object({
  id: z.bigint(),
  name: z.string(),
  description: z.string().nullable(),
  images: z.array(z.string()).nullable(),
  active: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
  _count: z.object({
    variants: z.number(),
  }),
});

export type ProductListResponseSchema = z.infer<typeof ProductListResponseSchema>;

// ============ VARIANT SCHEMAS ============

export const CreateVariantSchema = z.object({
  sku: z.string().min(1, "SKU is required").max(100),
  size: z.string().min(1, "Size is required").max(50),
  color: z.string().min(1, "Color is required").max(50),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, "Price must be a valid decimal"),
  stock: z.number().int().min(0, "Stock cannot be negative"),
  active: z.boolean().default(true),
});

export type CreateVariantSchema = z.infer<typeof CreateVariantSchema>;

export const UpdateVariantSchema = z.object({
  sku: z.string().min(1).max(100).optional(),
  size: z.string().min(1).max(50).optional(),
  color: z.string().min(1).max(50).optional(),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  stock: z.number().int().min(0).optional(),
  active: z.boolean().optional(),
});

export type UpdateVariantSchema = z.infer<typeof UpdateVariantSchema>;

export const VariantResponseSchema = z.object({
  id: z.bigint(),
  productId: z.bigint(),
  sku: z.string(),
  size: z.string(),
  color: z.string(),
  price: z.string(), // Decimal as string
  stock: z.number(),
  active: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type VariantResponseSchema = z.infer<typeof VariantResponseSchema>;

// ============ PAGINATION ============

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationSchema = z.infer<typeof PaginationSchema>;

export const PaginatedProductsResponseSchema = z.object({
  items: z.array(ProductListResponseSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
  totalPages: z.number(),
});

export type PaginatedProductsResponseSchema = z.infer<
  typeof PaginatedProductsResponseSchema
>;
