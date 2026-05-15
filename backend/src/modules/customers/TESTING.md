/**
 * Phase 4: Customers + Addresses Testing Guide
 *
 * Prerequisites:
 * 1. Backend must be running: npm run dev
 * 2. MySQL database must be accessible
 * 3. Admin user must be logged in (get JWT token from Phase 2)
 *
 * ============ CUSTOMER ENDPOINTS (ADMIN ONLY) ============
 *
 * 1. LIST CUSTOMERS (with pagination and search)
 *    GET http://localhost:4000/admin/customers?page=1&pageSize=20&search=john
 *    Authorization: Bearer <JWT_TOKEN>
 *
 *    Query Parameters:
 *    - page: Page number (default: 1)
 *    - pageSize: Items per page (default: 20, max: 100)
 *    - search: Optional search by name, phone, or email (case-insensitive)
 *
 *    Response:
 *    {
 *      "items": [
 *        {
 *          "id": "1",
 *          "fullName": "John Doe",
 *          "phone": "+94771234567",
 *          "email": "john@example.com",
 *          "createdAt": "2026-05-15T...",
 *          "updatedAt": "2026-05-15T...",
 *          "_count": {
 *            "addresses": 2,
 *            "salesOrders": 3
 *          }
 *        }
 *      ],
 *      "total": 42,
 *      "page": 1,
 *      "pageSize": 20,
 *      "totalPages": 3
 *    }
 *
 * 2. GET CUSTOMER DETAILS
 *    GET http://localhost:4000/admin/customers/1
 *    Authorization: Bearer <JWT_TOKEN>
 *
 *    Response includes customer with all addresses:
 *    {
 *      "id": "1",
 *      "fullName": "John Doe",
 *      "phone": "+94771234567",
 *      "email": "john@example.com",
 *      "createdAt": "2026-05-15T...",
 *      "updatedAt": "2026-05-15T...",
 *      "addresses": [
 *        {
 *          "id": "10",
 *          "customerId": "1",
 *          "line1": "123 Main Street",
 *          "line2": "Apt 4B",
 *          "city": "Colombo",
 *          "district": "Western Province",
 *          "postalCode": "00100",
 *          "country": "Sri Lanka",
 *          "phone": "+94771234567",
 *          "isDefault": true,
 *          "createdAt": "2026-05-15T...",
 *          "updatedAt": "2026-05-15T..."
 *        },
 *        {
 *          "id": "11",
 *          "customerId": "1",
 *          "line1": "456 Work Avenue",
 *          "line2": null,
 *          "city": "Kandy",
 *          "district": "Central Province",
 *          "postalCode": "20000",
 *          "country": "Sri Lanka",
 *          "phone": "+94771234567",
 *          "isDefault": false,
 *          "createdAt": "2026-05-15T...",
 *          "updatedAt": "2026-05-15T..."
 *        }
 *      ],
 *      "_count": {
 *        "addresses": 2,
 *        "salesOrders": 3
 *      }
 *    }
 *
 * ============ ADDRESS ENDPOINTS (ADMIN ONLY) ============
 *
 * 3. LIST ADDRESSES FOR A CUSTOMER
 *    GET http://localhost:4000/admin/customers/1/addresses
 *    Authorization: Bearer <JWT_TOKEN>
 *
 *    Response: Array of addresses (ordered by isDefault DESC, then createdAt DESC)
 *    [
 *      { ...address1 with isDefault: true },
 *      { ...address2 with isDefault: false }
 *    ]
 *
 * 4. CREATE ADDRESS
 *    POST http://localhost:4000/admin/customers/1/addresses
 *    Authorization: Bearer <JWT_TOKEN>
 *    Content-Type: application/json
 *
 *    {
 *      "line1": "123 Main Street",
 *      "line2": "Apt 4B",
 *      "city": "Colombo",
 *      "district": "Western Province",
 *      "postalCode": "00100",
 *      "country": "Sri Lanka",
 *      "phone": "+94771234567",
 *      "isDefault": true
 *    }
 *
 *    Notes:
 *    - If isDefault is true, other default addresses for this customer are unset
 *    - If this is the first address, it's automatically set as default
 *    - All fields are required except line2 (optional)
 *
 *    Response: 201 Created
 *    {
 *      "id": "12",
 *      "customerId": "1",
 *      "line1": "123 Main Street",
 *      "line2": "Apt 4B",
 *      "city": "Colombo",
 *      "district": "Western Province",
 *      "postalCode": "00100",
 *      "country": "Sri Lanka",
 *      "phone": "+94771234567",
 *      "isDefault": true,
 *      "createdAt": "2026-05-15T...",
 *      "updatedAt": "2026-05-15T..."
 *    }
 *
 * 5. UPDATE ADDRESS
 *    PATCH http://localhost:4000/admin/customers/1/addresses/12
 *    Authorization: Bearer <JWT_TOKEN>
 *    Content-Type: application/json
 *
 *    {
 *      "city": "Kandy",
 *      "isDefault": false
 *    }
 *
 *    Notes:
 *    - Only include fields you want to update
 *    - If setting isDefault to true, other default addresses are unset
 *    - If setting isDefault to false on the default address, another address is set as default
 *
 *    Response: 200 OK with updated address
 *
 * 6. DELETE ADDRESS
 *    DELETE http://localhost:4000/admin/customers/1/addresses/12
 *    Authorization: Bearer <JWT_TOKEN>
 *
 *    Notes:
 *    - Cannot delete the only address for a customer
 *    - If deleting the default address, another one is set as default
 *
 *    Response: 200 OK
 *    { "message": "Address deleted", "id": "12" }
 *
 * ============ ERROR CASES ============
 *
 * - Missing auth token: GET /admin/customers without Authorization header
 *   Response: 401 "Missing or invalid authentication token"
 *
 * - Insufficient permissions: Non-admin user
 *   Response: 403 "Insufficient permissions"
 *
 * - Invalid pagination: ?page=0 or ?pageSize=101
 *   Response: 400 Validation error
 *
 * - Customer not found: GET /admin/customers/99999
 *   Response: 404 "Customer not found"
 *
 * - Address not found: DELETE /admin/customers/1/addresses/99999
 *   Response: 404 "Address not found"
 *
 * - Cannot delete only address:
 *   Response: 400 "Cannot delete the only address for a customer"
 *
 * - Address belongs to different customer:
 *   PATCH /admin/customers/1/addresses/999 (where 999 belongs to customer 2)
 *   Response: 404 "Address not found"
 *
 * ============ AUDIT LOGGING ============
 *
 * Admin actions are logged to AuditLog table:
 * - address_created
 * - address_updated
 * - address_deleted
 *
 * Query audit logs from database:
 *   SELECT * FROM AuditLog WHERE action LIKE 'address%' ORDER BY createdAt DESC;
 *
 * ============ INTEGRATION WITH OTHER PHASES ============
 *
 * Phase 5 (Checkout) will:
 * 1. Use getOrCreateCustomer() to find or create a customer
 * 2. Use createAddress() to save delivery address during checkout
 * 3. Use getDefaultAddressForCustomer() to pre-fill customer's default address
 *
 * Public checkout endpoints (Phase 5):
 * - POST /checkout (creates customer + order + payment intent)
 * - GET /orders/:orderNumber (public status lookup)
 */
