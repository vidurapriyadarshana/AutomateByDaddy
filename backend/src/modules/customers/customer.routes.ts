import { Router } from "express";
import type { RequestHandler } from "express";
import { validate } from "../../middlewares/validate.middleware";
import { requireAuth } from "../../middlewares/auth.middleware";
import {
  CustomerListQuerySchema,
  CreateAddressSchema,
  UpdateAddressSchema,
} from "../../schemas/customer.schema";
import {
  listCustomersHandler,
  getCustomerHandler,
  listAddressesHandler,
  createAddressHandler,
  updateAddressHandler,
  deleteAddressHandler,
} from "./customer.controller";

const router = Router();

// ============ CUSTOMER ROUTES (ADMIN ONLY) ============

/**
 * GET /admin/customers
 * List all customers with pagination and search
 */
router.get(
  "/",
  requireAuth("admin"),
  validate("query", CustomerListQuerySchema),
  listCustomersHandler as unknown as RequestHandler,
);

/**
 * GET /admin/customers/:id
 * Get customer details with addresses
 */
router.get("/:id", requireAuth("admin"), getCustomerHandler as unknown as RequestHandler);

// ============ ADDRESS ROUTES (ADMIN ONLY) ============

/**
 * GET /admin/customers/:customerId/addresses
 * List all addresses for a customer
 */
router.get(
  "/:customerId/addresses",
  requireAuth("admin"),
  listAddressesHandler as unknown as RequestHandler,
);

/**
 * POST /admin/customers/:customerId/addresses
 * Create a new address for a customer
 */
router.post(
  "/:customerId/addresses",
  requireAuth("admin"),
  validate("body", CreateAddressSchema),
  createAddressHandler as unknown as RequestHandler,
);

/**
 * PATCH /admin/customers/:customerId/addresses/:addressId
 * Update an address
 */
router.patch(
  "/:customerId/addresses/:addressId",
  requireAuth("admin"),
  validate("body", UpdateAddressSchema),
  updateAddressHandler as unknown as RequestHandler,
);

/**
 * DELETE /admin/customers/:customerId/addresses/:addressId
 * Delete an address
 */
router.delete(
  "/:customerId/addresses/:addressId",
  requireAuth("admin"),
  deleteAddressHandler as unknown as RequestHandler,
);

export default router;
