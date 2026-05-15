import { getPrisma } from "../../db/prisma";
import { getPaginationParams, buildPaginatedResponse } from "../../utils/pagination";
import type {
  CreateCustomerSchema,
  CreateAddressSchema,
  UpdateAddressSchema,
} from "../../schemas/customer.schema";

// ============ CUSTOMER SERVICE ============

/**
 * Get or create a customer by phone and name
 * Used during checkout when customer info is provided
 */
export async function getOrCreateCustomer(
  fullName: string,
  phone: string,
  email?: string,
) {
  const prisma = getPrisma() as any;

  // Try to find existing customer by phone (phone is unique in schema)
  let customer = await prisma.customer.findUnique({
    where: { phone },
  });

  if (customer) {
    return customer;
  }

  // Create new customer
  customer = await prisma.customer.create({
    data: {
      fullName,
      phone,
      email: email || null,
    },
  });

  return customer;
}

/**
 * Get customer by ID with addresses
 */
export async function getCustomerById(customerId: bigint) {
  const prisma = getPrisma() as any;

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      addresses: {
        orderBy: { isDefault: "desc" },
      },
      _count: {
        select: {
          addresses: true,
          salesOrders: true,
        },
      },
    },
  });

  return customer;
}

/**
 * Get customer by phone (useful for WhatsApp lookups)
 */
export async function getCustomerByPhone(phone: string) {
  const prisma = getPrisma() as any;

  const customer = await prisma.customer.findUnique({
    where: { phone },
    include: {
      addresses: {
        orderBy: { isDefault: "desc" },
      },
    },
  });

  return customer;
}

/**
 * List customers with pagination and optional search
 */
export async function listCustomers(
  page: number,
  pageSize: number,
  search?: string,
) {
  const prisma = getPrisma() as any;
  const { skip, take } = getPaginationParams(page, pageSize);

  const whereClause: any = {};

  if (search && search.trim()) {
    whereClause.OR = [
      { fullName: { contains: search, mode: "insensitive" } },
      { phone: { contains: search } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            addresses: true,
            salesOrders: true,
          },
        },
      },
      skip,
      take,
      orderBy: { createdAt: "desc" },
    }),
    prisma.customer.count({
      where: whereClause,
    }),
  ]);

  return buildPaginatedResponse(customers, total, page, pageSize);
}

/**
 * Update customer info
 */
export async function updateCustomer(
  customerId: bigint,
  input: Partial<CreateCustomerSchema>,
) {
  const prisma = getPrisma() as any;

  const updateData: any = {};

  if (input.fullName !== undefined) updateData.fullName = input.fullName;
  if (input.phone !== undefined) updateData.phone = input.phone;
  if (input.email !== undefined) updateData.email = input.email || null;

  const customer = await prisma.customer.update({
    where: { id: customerId },
    data: updateData,
  });

  return customer;
}

// ============ ADDRESS SERVICE ============

/**
 * Get address by ID
 */
export async function getAddressById(addressId: bigint) {
  const prisma = getPrisma() as any;

  const address = await prisma.address.findUnique({
    where: { id: addressId },
  });

  return address;
}

/**
 * Create a new address for a customer
 */
export async function createAddress(customerId: bigint, input: CreateAddressSchema) {
  const prisma = getPrisma() as any;

  // Verify customer exists
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
  });

  if (!customer) {
    throw new Error("Customer not found");
  }

  // If this is the first address or isDefault is true, set as default
  const addressCount = await prisma.address.count({
    where: { customerId },
  });

  const isDefault = input.isDefault || addressCount === 0;

  // If setting as default, unset other defaults
  if (isDefault) {
    await prisma.address.updateMany({
      where: { customerId, isDefault: true },
      data: { isDefault: false },
    });
  }

  const address = await prisma.address.create({
    data: {
      customerId,
      line1: input.line1,
      line2: input.line2 || null,
      city: input.city,
      district: input.district,
      postalCode: input.postalCode,
      country: input.country,
      phone: input.phone,
      isDefault,
    },
  });

  return address;
}

/**
 * Get all addresses for a customer
 */
export async function getAddressesByCustomerId(customerId: bigint) {
  const prisma = getPrisma() as any;

  const addresses = await prisma.address.findMany({
    where: { customerId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  return addresses;
}

/**
 * Update an address
 */
export async function updateAddress(addressId: bigint, input: UpdateAddressSchema) {
  const prisma = getPrisma() as any;

  const address = await prisma.address.findUnique({
    where: { id: addressId },
  });

  if (!address) {
    throw new Error("Address not found");
  }

  const updateData: any = {};

  if (input.line1 !== undefined) updateData.line1 = input.line1;
  if (input.line2 !== undefined) updateData.line2 = input.line2 || null;
  if (input.city !== undefined) updateData.city = input.city;
  if (input.district !== undefined) updateData.district = input.district;
  if (input.postalCode !== undefined) updateData.postalCode = input.postalCode;
  if (input.country !== undefined) updateData.country = input.country;
  if (input.phone !== undefined) updateData.phone = input.phone;

  // If setting as default, unset other defaults for this customer
  if (input.isDefault === true) {
    await prisma.address.updateMany({
      where: {
        customerId: address.customerId,
        id: { not: addressId },
        isDefault: true,
      },
      data: { isDefault: false },
    });
    updateData.isDefault = true;
  } else if (input.isDefault === false) {
    updateData.isDefault = false;
  }

  const updatedAddress = await prisma.address.update({
    where: { id: addressId },
    data: updateData,
  });

  return updatedAddress;
}

/**
 * Delete an address (only if not the default or last one)
 */
export async function deleteAddress(addressId: bigint) {
  const prisma = getPrisma() as any;

  const address = await prisma.address.findUnique({
    where: { id: addressId },
  });

  if (!address) {
    throw new Error("Address not found");
  }

  // Check if this is the last address
  const addressCount = await prisma.address.count({
    where: { customerId: address.customerId },
  });

  if (addressCount === 1) {
    throw new Error("Cannot delete the only address for a customer");
  }

  // If this was the default, set another one as default
  if (address.isDefault) {
    const nextAddress = await prisma.address.findFirst({
      where: {
        customerId: address.customerId,
        id: { not: addressId },
      },
      orderBy: { createdAt: "desc" },
    });

    if (nextAddress) {
      await prisma.address.update({
        where: { id: nextAddress.id },
        data: { isDefault: true },
      });
    }
  }

  await prisma.address.delete({
    where: { id: addressId },
  });
}

/**
 * Get default address for a customer
 */
export async function getDefaultAddressForCustomer(customerId: bigint) {
  const prisma = getPrisma() as any;

  const address = await prisma.address.findFirst({
    where: {
      customerId,
      isDefault: true,
    },
  });

  return address;
}
