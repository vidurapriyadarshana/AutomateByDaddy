/**
 * Phase 3: Products + Variants Testing Guide
 *
 * Prerequisites:
 * 1. Backend must be running: npm run dev
 * 2. MySQL database must be accessible
 * 3. Prisma client must be generated
 * 4. Admin user must be created and logged in (get JWT token from Phase 2)
 *
 * ============ PUBLIC PRODUCT ENDPOINTS ============
 *
 * 1. LIST ACTIVE PRODUCTS (PUBLIC)
 *    GET http://localhost:4000/products?page=1&pageSize=20
 *
 *    Response:
 *    {
 *      "items": [
 *        {
 *          "id": "1",
 *          "name": "Black Oversized T-Shirt",
 *          "description": "...",
 *          "images": ["url1", "url2"],
 *          "active": true,
 *          "createdAt": "2026-05-15T...",
 *          "updatedAt": "2026-05-15T...",
 *          "_count": { "variants": 5 }
 *        }
 *      ],
 *      "total": 42,
 *      "page": 1,
 *      "pageSize": 20,
 *      "totalPages": 3
 *    }
 *
 * 2. GET PRODUCT BY ID (PUBLIC)
 *    GET http://localhost:4000/products/1
 *
 *    Response includes active variants only:
 *    {
 *      "id": "1",
 *      "name": "Black Oversized T-Shirt",
 *      "description": "...",
 *      "images": ["url1", "url2"],
 *      "active": true,
 *      "variants": [
 *        {
 *          "id": "10",
 *          "productId": "1",
 *          "sku": "SHIRT-BLK-M",
 *          "size": "M",
 *          "color": "Black",
 *          "price": "3500.00",
 *          "stock": 45,
 *          "active": true,
 *          "createdAt": "2026-05-15T...",
 *          "updatedAt": "2026-05-15T..."
 *        }
 *      ]
 *    }
 *
 * 3. GET VARIANT BY SKU (PUBLIC, useful for WhatsApp bot)
 *    GET http://localhost:4000/variants/sku/SHIRT-BLK-M
 *
 *    Response:
 *    {
 *      "id": "10",
 *      "productId": "1",
 *      "sku": "SHIRT-BLK-M",
 *      "size": "M",
 *      "color": "Black",
 *      "price": "3500.00",
 *      "stock": 45,
 *      "active": true,
 *      "createdAt": "2026-05-15T...",
 *      "updatedAt": "2026-05-15T..."
 *    }
 *
 * ============ ADMIN PRODUCT ENDPOINTS ============
 *
 * 4. CREATE PRODUCT (ADMIN ONLY)
 *    POST http://localhost:4000/admin/products
 *    Authorization: Bearer <JWT_TOKEN>
 *    Content-Type: application/json
 *
 *    {
 *      "name": "Black Oversized T-Shirt",
 *      "description": "Premium oversized fit, 100% cotton",
 *      "images": ["https://example.com/img1.jpg", "https://example.com/img2.jpg"],
 *      "active": true
 *    }
 *
 *    Response: 201 Created
 *    {
 *      "id": "1",
 *      "name": "Black Oversized T-Shirt",
 *      "description": "Premium oversized fit, 100% cotton",
 *      "images": ["https://example.com/img1.jpg", "https://example.com/img2.jpg"],
 *      "active": true,
 *      "createdAt": "2026-05-15T...",
 *      "updatedAt": "2026-05-15T...",
 *      "_count": { "variants": 0 }
 *    }
 *
 * 5. LIST ALL PRODUCTS (ADMIN - includes inactive)
 *    GET http://localhost:4000/admin/products?page=1&pageSize=20
 *    Authorization: Bearer <JWT_TOKEN>
 *
 *    Response: Same format as #1 but includes inactive products
 *
 * 6. UPDATE PRODUCT (ADMIN ONLY)
 *    PATCH http://localhost:4000/admin/products/1
 *    Authorization: Bearer <JWT_TOKEN>
 *    Content-Type: application/json
 *
 *    {
 *      "name": "Premium Black Oversized T-Shirt",
 *      "active": true
 *    }
 *
 *    Response: 200 OK with updated product
 *
 * 7. DEACTIVATE PRODUCT (ADMIN ONLY)
 *    DELETE http://localhost:4000/admin/products/1
 *    Authorization: Bearer <JWT_TOKEN>
 *
 *    Response: 200 OK
 *    { "message": "Product deactivated", "id": "1" }
 *
 * ============ ADMIN VARIANT ENDPOINTS ============
 *
 * 8. CREATE VARIANT (ADMIN ONLY)
 *    POST http://localhost:4000/admin/products/1/variants
 *    Authorization: Bearer <JWT_TOKEN>
 *    Content-Type: application/json
 *
 *    {
 *      "sku": "SHIRT-BLK-M",
 *      "size": "M",
 *      "color": "Black",
 *      "price": "3500.00",
 *      "stock": 45,
 *      "active": true
 *    }
 *
 *    Response: 201 Created
 *    {
 *      "id": "10",
 *      "productId": "1",
 *      "sku": "SHIRT-BLK-M",
 *      "size": "M",
 *      "color": "Black",
 *      "price": "3500.00",
 *      "stock": 45,
 *      "active": true,
 *      "createdAt": "2026-05-15T...",
 *      "updatedAt": "2026-05-15T..."
 *    }
 *
 * 9. LIST VARIANTS FOR PRODUCT (ADMIN - includes inactive)
 *    GET http://localhost:4000/admin/products/1/variants
 *    Authorization: Bearer <JWT_TOKEN>
 *
 *    Response: Array of all variants (active and inactive)
 *    [
 *      { ...variant1 },
 *      { ...variant2 }
 *    ]
 *
 * 10. UPDATE VARIANT (ADMIN ONLY)
 *     PATCH http://localhost:4000/admin/variants/10
 *     Authorization: Bearer <JWT_TOKEN>
 *     Content-Type: application/json
 *
 *     {
 *       "price": "3999.00",
 *       "stock": 50
 *     }
 *
 *     Response: 200 OK with updated variant
 *
 * ============ ERROR CASES ============
 *
 * - Invalid pagination: ?page=0 or ?pageSize=101
 *   Response: 400 Validation error
 *
 * - Missing required field: Create product without name
 *   Response: 400 Validation error
 *
 * - Invalid price format: price="abc"
 *   Response: 400 Validation error
 *
 * - Duplicate SKU: Create variant with existing SKU
 *   Response: 409 Conflict "Variant with this size/color combination already exists"
 *
 * - Missing auth token: GET /admin/products without Authorization header
 *   Response: 401 "Missing or invalid authentication token"
 *
 * - Insufficient permissions: Non-admin user trying to create product
 *   Response: 403 "Insufficient permissions"
 *
 * - Product not found: GET /products/99999
 *   Response: 404 "Product not found"
 *
 * ============ AUDIT LOGGING ============
 *
 * Every admin action is logged to AuditLog table:
 * - product_created
 * - product_updated
 * - product_deactivated
 * - variant_created
 * - variant_updated
 *
 * Query audit logs from database:
 *   SELECT * FROM AuditLog WHERE action LIKE 'product%' ORDER BY createdAt DESC;
 */
