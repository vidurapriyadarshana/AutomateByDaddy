import { Router } from "express";
import type { RequestHandler } from "express";
import { validate } from "../../middlewares/validate.middleware";
import { requireAuth } from "../../middlewares/auth.middleware";
import {
  CreateProductSchema,
  UpdateProductSchema,
  CreateVariantSchema,
  UpdateVariantSchema,
  PaginationSchema,
} from "../../schemas/product.schema";
import {
  listProductsHandler,
  listProductsAdminHandler,
  getProductHandler,
  createProductHandler,
  updateProductHandler,
  deleteProductHandler,
  createVariantHandler,
  listVariantsHandler,
  getVariantHandler,
  getVariantBySkuHandler,
  updateVariantHandler,
} from "./product.controller";

const router = Router();

// ============ PUBLIC PRODUCT ROUTES ============

/**
 * GET /products
 * List all active products with pagination
 */
router.get(
  "/",
  validate("query", PaginationSchema),
  listProductsHandler as unknown as RequestHandler,
);

/**
 * GET /products/:id
 * Get active product by ID with active variants
 */
router.get("/:id", getProductHandler as unknown as RequestHandler);

// ============ PUBLIC VARIANT ROUTES ============

/**
 * GET /variants/sku/:sku
 * Get variant by SKU (for WhatsApp and inventory tools)
 */
router.get("/sku/:sku", getVariantBySkuHandler as unknown as RequestHandler);

/**
 * GET /variants/:id
 * Get variant by ID
 */
router.get("/:id", getVariantHandler as unknown as RequestHandler);

// ============ ADMIN PRODUCT ROUTES ============

/**
 * GET /admin/products
 * List all products (including inactive) with pagination
 */
router.get(
  "/admin/products",
  requireAuth("admin"),
  validate("query", PaginationSchema),
  listProductsAdminHandler as unknown as RequestHandler,
);

/**
 * POST /admin/products
 * Create a new product
 */
router.post(
  "/admin/products",
  requireAuth("admin"),
  validate("body", CreateProductSchema),
  createProductHandler as unknown as RequestHandler,
);

/**
 * PATCH /admin/products/:id
 * Update a product
 */
router.patch(
  "/admin/products/:id",
  requireAuth("admin"),
  validate("body", UpdateProductSchema),
  updateProductHandler as unknown as RequestHandler,
);

/**
 * DELETE /admin/products/:id
 * Deactivate a product
 */
router.delete(
  "/admin/products/:id",
  requireAuth("admin"),
  deleteProductHandler as unknown as RequestHandler,
);

// ============ ADMIN VARIANT ROUTES ============

/**
 * POST /admin/products/:productId/variants
 * Create a new variant for a product
 */
router.post(
  "/admin/products/:productId/variants",
  requireAuth("admin"),
  validate("body", CreateVariantSchema),
  createVariantHandler as unknown as RequestHandler,
);

/**
 * GET /admin/products/:productId/variants
 * List all variants for a product (including inactive)
 */
router.get(
  "/admin/products/:productId/variants",
  requireAuth("admin"),
  listVariantsHandler as unknown as RequestHandler,
);

/**
 * PATCH /admin/variants/:id
 * Update a variant
 */
router.patch(
  "/admin/variants/:id",
  requireAuth("admin"),
  validate("body", UpdateVariantSchema),
  updateVariantHandler as unknown as RequestHandler,
);

export default router;
