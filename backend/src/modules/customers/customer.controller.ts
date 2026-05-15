import type { Request, Response } from "express";
import {
  getCustomerById,
  listCustomers,
  getAddressesByCustomerId,
  createAddress,
  updateAddress,
  deleteAddress,
} from "./customer.service";
import { auditAction } from "../../utils/audit-log";
import type { AuthenticatedUser } from "../../types";
import type {
  CustomerListQuerySchema,
  CreateAddressSchema,
  UpdateAddressSchema,
} from "../../schemas/customer.schema";

// ============ CUSTOMER HANDLERS ============

/**
 * GET /admin/customers
 * List all customers with pagination and optional search
 */
export async function listCustomersHandler(
  req: Request<unknown, unknown, unknown, CustomerListQuerySchema>,
  res: Response,
) {
  const { page, pageSize, search } = req.query as any;
  const result = await listCustomers(page, pageSize, search);
  res.json(result);
}

/**
 * GET /admin/customers/:id
 * Get customer details with all addresses
 */
export async function getCustomerHandler(req: Request<{ id: string }>, res: Response) {
  const customerId = BigInt(req.params.id);

  try {
    const customer = await getCustomerById(customerId);

    if (!customer) {
      res.status(404).json({
        error: {
          message: "Customer not found",
          code: "NOT_FOUND",
        },
      });
      return;
    }

    res.json(customer);
  } catch (err) {
    res.status(404).json({
      error: {
        message: "Customer not found",
        code: "NOT_FOUND",
      },
    });
  }
}

// ============ ADDRESS HANDLERS ============

/**
 * GET /admin/customers/:customerId/addresses
 * List all addresses for a customer
 */
export async function listAddressesHandler(
  req: Request<{ customerId: string }>,
  res: Response,
) {
  const customerId = BigInt(req.params.customerId);

  try {
    const addresses = await getAddressesByCustomerId(customerId);
    res.json(addresses);
  } catch (err) {
    res.status(404).json({
      error: {
        message: "Customer not found",
        code: "NOT_FOUND",
      },
    });
  }
}

/**
 * POST /admin/customers/:customerId/addresses
 * Create a new address for a customer
 */
export async function createAddressHandler(
  req: Request<{ customerId: string }, unknown, CreateAddressSchema>,
  res: Response,
) {
  const user = (req as any).user as AuthenticatedUser;
  const customerId = BigInt(req.params.customerId);

  try {
    const address = await createAddress(customerId, req.body);

    // Audit log
    await auditAction("address_created", user, {
      meta: {
        customerId,
        addressId: address.id,
        city: address.city,
        isDefault: address.isDefault,
      },
    });

    res.status(201).json(address);
  } catch (err: any) {
    if (err.message.includes("not found")) {
      res.status(404).json({
        error: {
          message: "Customer not found",
          code: "NOT_FOUND",
        },
      });
    } else {
      throw err;
    }
  }
}

/**
 * PATCH /admin/customers/:customerId/addresses/:addressId
 * Update an address
 */
export async function updateAddressHandler(
  req: Request<{ customerId: string; addressId: string }, unknown, UpdateAddressSchema>,
  res: Response,
) {
  const user = (req as any).user as AuthenticatedUser;
  const customerId = BigInt(req.params.customerId);
  const addressId = BigInt(req.params.addressId);

  try {
    const address = await updateAddress(addressId, req.body);

    // Verify address belongs to customer
    if (address.customerId !== customerId) {
      res.status(404).json({
        error: {
          message: "Address not found",
          code: "NOT_FOUND",
        },
      });
      return;
    }

    // Audit log
    await auditAction("address_updated", user, {
      meta: {
        customerId,
        addressId: address.id,
        changes: req.body,
      },
    });

    res.json(address);
  } catch (err: any) {
    if (err.message.includes("not found")) {
      res.status(404).json({
        error: {
          message: "Address not found",
          code: "NOT_FOUND",
        },
      });
    } else {
      throw err;
    }
  }
}

/**
 * DELETE /admin/customers/:customerId/addresses/:addressId
 * Delete an address
 */
export async function deleteAddressHandler(
  req: Request<{ customerId: string; addressId: string }>,
  res: Response,
) {
  const user = (req as any).user as AuthenticatedUser;
  const customerId = BigInt(req.params.customerId);
  const addressId = BigInt(req.params.addressId);

  try {
    await deleteAddress(addressId);

    // Audit log
    await auditAction("address_deleted", user, {
      meta: {
        customerId,
        addressId,
      },
    });

    res.json({ message: "Address deleted", id: addressId });
  } catch (err: any) {
    if (err.message.includes("not found")) {
      res.status(404).json({
        error: {
          message: "Address not found",
          code: "NOT_FOUND",
        },
      });
    } else if (err.message.includes("Cannot delete")) {
      res.status(400).json({
        error: {
          message: err.message,
          code: "INVALID_REQUEST",
        },
      });
    } else {
      throw err;
    }
  }
}
