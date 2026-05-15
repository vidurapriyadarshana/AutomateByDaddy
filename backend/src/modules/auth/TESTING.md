/**
 * Phase 2: Auth Testing Guide
 *
 * Prerequisites:
 * 1. Backend must be running: npm run dev
 * 2. MySQL database must be accessible (DATABASE_URL in .env)
 * 3. Prisma client must be generated: npm run prisma:generate
 *
 * Testing Auth Endpoints:
 *
 * 1. CREATE TEST ADMIN USER (via database directly or seed)
 *    INSERT INTO AdminUser (email, passwordHash, role, active)
 *    VALUES ('admin@example.com', '<bcrypt-hash>', 'admin', true)
 *
 *    To create a bcrypt hash, use this Node script:
 *    const bcrypt = require('bcrypt');
 *    bcrypt.hash('password123', 10).then(hash => console.log(hash));
 *
 * 2. LOGIN - Get JWT Token
 *    POST http://localhost:4000/auth/login
 *    Content-Type: application/json
 *
 *    {
 *      "email": "admin@example.com",
 *      "password": "password123"
 *    }
 *
 *    Response:
 *    {
 *      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *      "user": {
 *        "id": 1,
 *        "email": "admin@example.com",
 *        "role": "admin"
 *      }
 *    }
 *
 * 3. GET CURRENT USER (using token from login)
 *    GET http://localhost:4000/auth/me
 *    Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *
 *    Response:
 *    {
 *      "id": 1,
 *      "email": "admin@example.com",
 *      "role": "admin",
 *      "active": true
 *    }
 *
 * 4. ERROR CASES
 *
 *    - Invalid email/password (login):
 *      POST /auth/login with wrong password
 *      Response: 401 { error: { message: "Invalid email or password", code: "INVALID_CREDENTIALS" } }
 *
 *    - Missing token (me):
 *      GET /auth/me without Authorization header
 *      Response: 401 { error: { message: "Not authenticated", code: "UNAUTHORIZED" } }
 *
 *    - Invalid token (me):
 *      GET /auth/me with malformed/expired token
 *      Response: 401 { error: { message: "Not authenticated", code: "UNAUTHORIZED" } }
 *
 * Using Auth in Other Routes (Examples for Phase 3+):
 *
 * Protected admin routes should use requireAuth() middleware:
 *
 *    router.post('/admin/products',
 *      requireAuth('admin'),  // Require admin role
 *      validate('body', CreateProductSchema),
 *      createProduct
 *    );
 *
 * Optional auth (attach user if token provided):
 *
 *    router.get('/products',
 *      listProducts  // No auth required, but req.user will be set if token provided
 *    );
 *
 * Audit Logging (examples for Phase 3+):
 *
 *    import { auditAction } from '../utils/audit-log';
 *
 *    // In an admin controller:
 *    const user = (req as any).user as AuthenticatedUser;
 *    const newProduct = await createProductInDb(req.body);
 *
 *    await auditAction('product_created', user, {
 *      meta: { productId: newProduct.id, productName: newProduct.name }
 *    });
 */
