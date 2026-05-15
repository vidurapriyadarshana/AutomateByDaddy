import type { Request, Response } from "express";
import {
  createProduct,
  getProductById,
  getProductByIdAdmin,
  listProducts,
  listProductsAdmin,
  updateProduct,
  deactivateProduct,
  createVariant,
  getVariantById,
  getVariantBySku,
  listVariantsByProduct,
  updateVariant,
  checkAndReserveStock,
} from "./product.service";
import { auditAction } from "../../utils/audit-log";
import type { AuthenticatedUser } from "../../types";
import type {
  CreateProductSchema,
  UpdateProductSchema,
  CreateVariantSchema,
  UpdateVariantSchema,
  PaginationSchema,
} from "../../schemas/product.schema";

// ============ PRODUCT HANDLERS ============

/**
 * GET /products
 * List all active products (public)
 */
export async function listProductsHandler(
  req: Request<unknown, unknown, unknown, PaginationSchema>,
  res: Response,
) {
  const { page, pageSize } = req.query as any;
  const result = await listProducts(page, pageSize);
  res.json(result);
}

/**
 * GET /admin/products
 * List all products including inactive (admin only)
 */
export async function listProductsAdminHandler(
  req: Request<unknown, unknown, unknown, PaginationSchema>,
  res: Response,
) {
  const { page, pageSize } = req.query as any;
  const result = await listProductsAdmin(page, pageSize);
  res.json(result);
}

/**
 * GET /products/:id
 * Get product by ID (public, active variants only)
 */
export async function getProductHandler(req: Request<{ id: string }>, res: Response) {
  const productId = BigInt(req.params.id);
  const product = await getProductById(productId);

  if (!product || !product.active) {
    res.status(404).json({
      error: {
        message: "Product not found",
        code: "NOT_FOUND",
      },
    });
    return;
  }

  res.json(product);
}

/**
 * POST /admin/products
 * Create a new product (admin only)
 */
export async function createProductHandler(
  req: Request<unknown, unknown, CreateProductSchema>,
  res: Response,
) {
  const user = (req as any).user as AuthenticatedUser;

  const product = await createProduct(req.body);

  // Audit log
  await auditAction("product_created", user, {
    meta: { productId: product.id, productName: product.name },
  });

  res.status(201).json(product);
}

/**
 * PATCH /admin/products/:id
 * Update a product (admin only)
 */
export async function updateProductHandler(
  req: Request<{ id: string }, unknown, UpdateProductSchema>,
  res: Response,
) {
  const user = (req as any).user as AuthenticatedUser;
  const productId = BigInt(req.params.id);

  try {
    const product = await updateProduct(productId, req.body);

    // Audit log
    await auditAction("product_updated", user, {
      meta: { productId: product.id, productName: product.name, changes: req.body },
    });

    res.json(product);
  } catch (err) {
    res.status(404).json({
      error: {
        message: "Product not found",
        code: "NOT_FOUND",
      },
    });
  }
}

/**
 * DELETE /admin/products/:id
 * Deactivate a product (admin only)
 */
export async function deleteProductHandler(
  req: Request<{ id: string }>,
  res: Response,
) {
  const user = (req as any).user as AuthenticatedUser;
  const productId = BigInt(req.params.id);

  try {
    const product = await deactivateProduct(productId);

    // Audit log
    await auditAction("product_deactivated", user, {
      meta: { productId: product.id, productName: product.name },
    });

    res.json({ message: "Product deactivated", id: product.id });
  } catch (err) {
    res.status(404).json({
      error: {
        message: "Product not found",
        code: "NOT_FOUND",
      },
    });
  }
}

// ============ VARIANT HANDLERS ============

/**
 * POST /admin/products/:productId/variants
 * Create a new variant (admin only)
 */
export async function createVariantHandler(
  req: Request<{ productId: string }, unknown, CreateVariantSchema>,
  res: Response,
) {
  const user = (req as any).user as AuthenticatedUser;
  const productId = BigInt(req.params.productId);

  try {
    const variant = await createVariant(productId, req.body);

    // Audit log
    await auditAction("variant_created", user, {
      meta: {
        variantId: variant.id,
        productId,
        sku: variant.sku,
        size: variant.size,
        color: variant.color,
      },
    });

    res.status(201).json(variant);
  } catch (err: any) {
    if (err.message.includes("not found")) {
      res.status(404).json({
        error: {
          message: "Product not found",
          code: "NOT_FOUND",
        },
      });
    } else if (err.message.includes("already exists")) {
      res.status(409).json({
        error: {
          message: err.message,
          code: "CONFLICT",
        },
      });
    } else {
      throw err;
    }
  }
}

/**
 * GET /admin/products/:productId/variants
 * List variants for a product (admin view, includes inactive)
 */
export async function listVariantsHandler(
  req: Request<{ productId: string }>,
  res: Response,
) {
  const productId = BigInt(req.params.productId);

  const variants = await listVariantsByProduct(productId, true);

  res.json(variants);
}

/**
 * GET /variants/:id
 * Get variant by ID (public if product is active)
 */
export async function getVariantHandler(
  req: Request<{ id: string }>,
  res: Response,
) {
  const variantId = BigInt(req.params.id);

  const variant = await getVariantById(variantId);

  if (!variant) {
    res.status(404).json({
      error: {
        message: "Variant not found",
        code: "NOT_FOUND",
      },
    });
    return;
  }

  res.json(variant);
}

/**
 * GET /variants/sku/:sku
 * Get variant by SKU (useful for WhatsApp and inventory checks)
 */
export async function getVariantBySkuHandler(
  req: Request<{ sku: string }>,
  res: Response,
) {
  const variant = await getVariantBySku(req.params.sku);

  if (!variant) {
    res.status(404).json({
      error: {
        message: "Variant not found",
        code: "NOT_FOUND",
      },
    });
    return;
  }

  res.json(variant);
}

/**
 * PATCH /admin/variants/:id
 * Update a variant (admin only)
 */
export async function updateVariantHandler(
  req: Request<{ id: string }, unknown, UpdateVariantSchema>,
  res: Response,
) {
  const user = (req as any).user as AuthenticatedUser;
  const variantId = BigInt(req.params.id);

  try {
    const variant = await updateVariant(variantId, req.body);

    // Audit log
    await auditAction("variant_updated", user, {
      meta: { variantId: variant.id, changes: req.body },
    });

    res.json(variant);
  } catch (err) {
    res.status(404).json({
      error: {
        message: "Variant not found",
        code: "NOT_FOUND",
      },
    });
  }
}
