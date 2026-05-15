/**
 * Customer and Address Request/Response Schemas (Zod)
 */

import { z } from "zod";

// ============ CUSTOMER SCHEMAS ============

export const CreateCustomerSchema = z.object({
  fullName: z.string().min(1, "Full name is required").max(255),
  phone: z.string().min(1, "Phone is required").max(20),
  email: z.string().email("Invalid email format").optional(),
});

export type CreateCustomerSchema = z.infer<typeof CreateCustomerSchema>;

export const CustomerResponseSchema = z.object({
  id: z.bigint(),
  fullName: z.string(),
  phone: z.string(),
  email: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CustomerResponseSchema = z.infer<typeof CustomerResponseSchema>;

export const CustomerDetailResponseSchema = CustomerResponseSchema.extend({
  addresses: z.array(
    z.object({
      id: z.bigint(),
      line1: z.string(),
      line2: z.string().nullable(),
      city: z.string(),
      district: z.string(),
      postalCode: z.string(),
      country: z.string(),
      phone: z.string(),
      isDefault: z.boolean(),
      createdAt: z.date(),
      updatedAt: z.date(),
    }),
  ),
  _count: z.object({
    addresses: z.number(),
    salesOrders: z.number(),
  }),
});

export type CustomerDetailResponseSchema = z.infer<typeof CustomerDetailResponseSchema>;

// ============ ADDRESS SCHEMAS ============

export const CreateAddressSchema = z.object({
  line1: z.string().min(1, "Address line 1 is required").max(255),
  line2: z.string().max(255).optional(),
  city: z.string().min(1, "City is required").max(100),
  district: z.string().min(1, "District is required").max(100),
  postalCode: z.string().min(1, "Postal code is required").max(20),
  country: z.string().min(1, "Country is required").max(100),
  phone: z.string().min(1, "Phone is required").max(20),
  isDefault: z.boolean().default(false),
});

export type CreateAddressSchema = z.infer<typeof CreateAddressSchema>;

export const UpdateAddressSchema = z.object({
  line1: z.string().min(1).max(255).optional(),
  line2: z.string().max(255).optional(),
  city: z.string().min(1).max(100).optional(),
  district: z.string().min(1).max(100).optional(),
  postalCode: z.string().min(1).max(20).optional(),
  country: z.string().min(1).max(100).optional(),
  phone: z.string().min(1).max(20).optional(),
  isDefault: z.boolean().optional(),
});

export type UpdateAddressSchema = z.infer<typeof UpdateAddressSchema>;

export const AddressResponseSchema = z.object({
  id: z.bigint(),
  customerId: z.bigint(),
  line1: z.string(),
  line2: z.string().nullable(),
  city: z.string(),
  district: z.string(),
  postalCode: z.string(),
  country: z.string(),
  phone: z.string(),
  isDefault: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type AddressResponseSchema = z.infer<typeof AddressResponseSchema>;

// ============ PAGINATION ============

export const CustomerListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(), // Search by name or phone
});

export type CustomerListQuerySchema = z.infer<typeof CustomerListQuerySchema>;

export const PaginatedCustomersResponseSchema = z.object({
  items: z.array(CustomerResponseSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
  totalPages: z.number(),
});

export type PaginatedCustomersResponseSchema = z.infer<
  typeof PaginatedCustomersResponseSchema
>;
