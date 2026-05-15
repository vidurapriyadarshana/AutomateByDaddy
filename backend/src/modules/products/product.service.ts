import { getPrisma } from "../../db/prisma";
import { toDecimal, formatDecimal } from "../../utils/money";
import { getPaginationParams, buildPaginatedResponse } from "../../utils/pagination";
import type { CreateProductSchema, UpdateProductSchema, CreateVariantSchema, UpdateVariantSchema } from "../../schemas/product.schema";

// ============ PRODUCT SERVICE ============

/**
 * Create a new product
 */
export async function createProduct(input: CreateProductSchema) {
  const prisma = getPrisma() as any;

  const product = await prisma.product.create({
    data: {
      name: input.name,
      description: input.description || null,
      images: input.images || null,
      active: input.active,
    },
    include: {
      _count: {
        select: { variants: true },
      },
    },
  });

  return product;
}

/**
 * Get product by ID with variants
 */
export async function getProductById(productId: bigint) {
  const prisma = getPrisma() as any;

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      variants: {
        where: { active: true },
      },
      _count: {
        select: { variants: true },
      },
    },
  });

  return product;
}

/**
 * Get product by ID (admin view - includes inactive variants)
 */
export async function getProductByIdAdmin(productId: bigint) {
  const prisma = getPrisma() as any;

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      variants: true,
      _count: {
        select: { variants: true },
      },
    },
  });

  return product;
}

/**
 * List all active products with pagination
 */
export async function listProducts(page: number, pageSize: number) {
  const prisma = getPrisma() as any;
  const { skip, take } = getPaginationParams(page, pageSize);

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where: { active: true },
      include: {
        _count: {
          select: { variants: true },
        },
      },
      skip,
      take,
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.count({
      where: { active: true },
    }),
  ]);

  return buildPaginatedResponse(products, total, page, pageSize);
}

/**
 * List all products (admin view - includes inactive)
 */
export async function listProductsAdmin(page: number, pageSize: number) {
  const prisma = getPrisma() as any;
  const { skip, take } = getPaginationParams(page, pageSize);

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      include: {
        _count: {
          select: { variants: true },
        },
      },
      skip,
      take,
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.count(),
  ]);

  return buildPaginatedResponse(products, total, page, pageSize);
}

/**
 * Update a product
 */
export async function updateProduct(productId: bigint, input: UpdateProductSchema) {
  const prisma = getPrisma() as any;

  const product = await prisma.product.update({
    where: { id: productId },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description || null }),
      ...(input.images !== undefined && { images: input.images || null }),
      ...(input.active !== undefined && { active: input.active }),
    },
    include: {
      _count: {
        select: { variants: true },
      },
    },
  });

  return product;
}

/**
 * Delete a product (soft delete via active flag, or hard delete if no orders reference it)
 */
export async function deactivateProduct(productId: bigint) {
  const prisma = getPrisma() as any;

  const product = await prisma.product.update({
    where: { id: productId },
    data: { active: false },
  });

  return product;
}

// ============ VARIANT SERVICE ============

/**
 * Create a new variant for a product
 */
export async function createVariant(productId: bigint, input: CreateVariantSchema) {
  const prisma = getPrisma() as any;

  // Check if product exists
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new Error("Product not found");
  }

  // Check if variant with same size/color already exists
  const existing = await prisma.variant.findUnique({
    where: {
      productId_size_color: {
        productId,
        size: input.size,
        color: input.color,
      },
    },
  });

  if (existing) {
    throw new Error("Variant with this size/color combination already exists");
  }

  const variant = await prisma.variant.create({
    data: {
      productId,
      sku: input.sku,
      size: input.size,
      color: input.color,
      price: toDecimal(input.price),
      stock: input.stock,
      active: input.active,
    },
  });

  return serializeVariant(variant);
}

/**
 * Get variant by ID
 */
export async function getVariantById(variantId: bigint) {
  const prisma = getPrisma() as any;

  const variant = await prisma.variant.findUnique({
    where: { id: variantId },
  });

  return variant ? serializeVariant(variant) : null;
}

/**
 * Get variant by SKU (useful for WhatsApp and inventory checks)
 */
export async function getVariantBySku(sku: string) {
  const prisma = getPrisma() as any;

  const variant = await prisma.variant.findUnique({
    where: { sku },
    include: {
      product: true,
    },
  });

  return variant ? serializeVariant(variant) : null;
}

/**
 * List variants for a product
 */
export async function listVariantsByProduct(productId: bigint, includeInactive: boolean = false) {
  const prisma = getPrisma() as any;

  const variants = await prisma.variant.findMany({
    where: {
      productId,
      ...(includeInactive === false && { active: true }),
    },
    orderBy: { createdAt: "desc" },
  });

  return variants.map(serializeVariant);
}

/**
 * Update a variant
 */
export async function updateVariant(variantId: bigint, input: UpdateVariantSchema) {
  const prisma = getPrisma() as any;

  const updateData: any = {};

  if (input.sku !== undefined) updateData.sku = input.sku;
  if (input.size !== undefined) updateData.size = input.size;
  if (input.color !== undefined) updateData.color = input.color;
  if (input.price !== undefined) updateData.price = toDecimal(input.price);
  if (input.stock !== undefined) updateData.stock = input.stock;
  if (input.active !== undefined) updateData.active = input.active;

  const variant = await prisma.variant.update({
    where: { id: variantId },
    data: updateData,
  });

  return serializeVariant(variant);
}

/**
 * Check and reserve variant stock (used during checkout)
 * Returns true if stock is available, false otherwise
 */
export async function checkAndReserveStock(variantId: bigint, quantity: number): Promise<boolean> {
  const prisma = getPrisma() as any;

  const variant = await prisma.variant.findUnique({
    where: { id: variantId },
  });

  if (!variant || variant.stock < quantity) {
    return false;
  }

  // In a real system, we'd use transactions to prevent overselling
  // For now, we just verify stock is available
  return true;
}

/**
 * Update variant stock (increase or decrease)
 */
export async function updateVariantStock(variantId: bigint, deltaQuantity: number) {
  const prisma = getPrisma() as any;

  const variant = await prisma.variant.update({
    where: { id: variantId },
    data: {
      stock: {
        increment: deltaQuantity,
      },
    },
  });

  return serializeVariant(variant);
}

// ============ HELPERS ============

/**
 * Convert variant with Decimal to serializable format
 */
function serializeVariant(variant: any) {
  return {
    ...variant,
    price: formatDecimal(variant.price),
  };
}
