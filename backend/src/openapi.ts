// Comprehensive OpenAPI 3.0.3 specification for Home Business Automation Platform
// Documents all endpoints from Phases 2-5

export const openapiDocument = {
  openapi: "3.0.3",
  info: {
    title: "Home Business Automation Platform API",
    version: "0.1.0",
    description: "Backend API for e-commerce order management with product catalog, checkout, and admin dashboard",
  },
  servers: [{ url: "/", description: "Default server" }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "JWT token from /auth/login",
      },
    },
    schemas: {
      // ============ COMMON SCHEMAS ============
      HealthResponse: {
        type: "object",
        additionalProperties: false,
        required: ["ok"],
        properties: {
          ok: { type: "boolean", enum: [true] },
        },
      },
      VersionResponse: {
        type: "object",
        additionalProperties: false,
        required: ["name", "env"],
        properties: {
          name: { type: "string" },
          env: { type: "string" },
        },
      },
      ApiErrorBody: {
        type: "object",
        additionalProperties: false,
        required: ["error"],
        properties: {
          error: {
            type: "object",
            properties: {
              message: { type: "string" },
              code: { type: "string" },
              requestId: { type: "string" },
              details: { type: "object" },
            },
            required: ["message", "code"],
          },
        },
      },

      // ============ PHASE 2: AUTH SCHEMAS ============
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string" },
        },
      },
      AuthResponse: {
        type: "object",
        required: ["accessToken", "user"],
        properties: {
          accessToken: { type: "string", description: "JWT bearer token" },
          user: {
            type: "object",
            required: ["id", "email", "role"],
            properties: {
              id: { type: "integer", format: "int64" },
              email: { type: "string" },
              role: { type: "string", enum: ["admin", "staff"] },
            },
          },
        },
      },
      UserResponse: {
        type: "object",
        required: ["id", "email", "role", "active"],
        properties: {
          id: { type: "integer", format: "int64" },
          email: { type: "string" },
          role: { type: "string", enum: ["admin", "staff"] },
          active: { type: "boolean" },
        },
      },

      // ============ PHASE 3: PRODUCT SCHEMAS ============
      ProductResponse: {
        type: "object",
        required: ["id", "name", "active", "createdAt", "updatedAt"],
        properties: {
          id: { type: "integer", format: "int64" },
          name: { type: "string" },
          description: { type: "string", nullable: true },
          images: { type: "array", items: { type: "string", format: "uri" }, nullable: true },
          active: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
          _count: {
            type: "object",
            properties: { variants: { type: "integer" } },
          },
        },
      },
      VariantResponse: {
        type: "object",
        required: ["id", "productId", "sku", "size", "color", "price", "stock", "active", "createdAt", "updatedAt"],
        properties: {
          id: { type: "integer", format: "int64" },
          productId: { type: "integer", format: "int64" },
          sku: { type: "string", description: "Stock Keeping Unit" },
          size: { type: "string" },
          color: { type: "string" },
          price: { type: "string", pattern: "^\\d+(\\.\\d{2})?$", description: "Price in LKR" },
          stock: { type: "integer" },
          active: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      CreateProductRequest: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string", maxLength: 255 },
          description: { type: "string" },
          images: { type: "array", items: { type: "string", format: "uri" } },
          active: { type: "boolean", default: true },
        },
      },
      CreateVariantRequest: {
        type: "object",
        required: ["sku", "size", "color", "price", "stock"],
        properties: {
          sku: { type: "string", maxLength: 100 },
          size: { type: "string", maxLength: 50 },
          color: { type: "string", maxLength: 50 },
          price: { type: "string", pattern: "^\\d+(\\.\\d{1,2})?$" },
          stock: { type: "integer", minimum: 0 },
          active: { type: "boolean", default: true },
        },
      },
      PaginatedProducts: {
        type: "object",
        required: ["items", "total", "page", "pageSize", "totalPages"],
        properties: {
          items: { type: "array", items: { $ref: "#/components/schemas/ProductResponse" } },
          total: { type: "integer" },
          page: { type: "integer" },
          pageSize: { type: "integer" },
          totalPages: { type: "integer" },
        },
      },

      // ============ PHASE 4: CUSTOMER SCHEMAS ============
      CustomerResponse: {
        type: "object",
        required: ["id", "fullName", "phone", "createdAt", "updatedAt"],
        properties: {
          id: { type: "integer", format: "int64" },
          fullName: { type: "string" },
          phone: { type: "string" },
          email: { type: "string", format: "email", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
          _count: {
            type: "object",
            properties: {
              addresses: { type: "integer" },
              salesOrders: { type: "integer" },
            },
          },
        },
      },
      AddressResponse: {
        type: "object",
        required: ["id", "customerId", "line1", "city", "district", "postalCode", "country", "phone", "isDefault", "createdAt", "updatedAt"],
        properties: {
          id: { type: "integer", format: "int64" },
          customerId: { type: "integer", format: "int64" },
          line1: { type: "string" },
          line2: { type: "string", nullable: true },
          city: { type: "string" },
          district: { type: "string" },
          postalCode: { type: "string" },
          country: { type: "string" },
          phone: { type: "string" },
          isDefault: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      CreateAddressRequest: {
        type: "object",
        required: ["line1", "city", "district", "postalCode", "country", "phone"],
        properties: {
          line1: { type: "string", maxLength: 255 },
          line2: { type: "string", maxLength: 255 },
          city: { type: "string", maxLength: 100 },
          district: { type: "string", maxLength: 100 },
          postalCode: { type: "string", maxLength: 20 },
          country: { type: "string", maxLength: 100 },
          phone: { type: "string", maxLength: 20 },
          isDefault: { type: "boolean", default: false },
        },
      },
      PaginatedCustomers: {
        type: "object",
        required: ["items", "total", "page", "pageSize", "totalPages"],
        properties: {
          items: { type: "array", items: { $ref: "#/components/schemas/CustomerResponse" } },
          total: { type: "integer" },
          page: { type: "integer" },
          pageSize: { type: "integer" },
          totalPages: { type: "integer" },
        },
      },

      // ============ PHASE 5: ORDER SCHEMAS ============
      OrderItemResponse: {
        type: "object",
        required: ["id", "orderId", "variantId", "quantity", "unitPrice", "lineTotal"],
        properties: {
          id: { type: "integer", format: "int64" },
          orderId: { type: "integer", format: "int64" },
          variantId: { type: "integer", format: "int64" },
          quantity: { type: "integer" },
          unitPrice: { type: "string", description: "Decimal as string" },
          lineTotal: { type: "string", description: "Decimal as string" },
        },
      },
      OrderResponse: {
        type: "object",
        required: ["id", "orderNumber", "customerId", "addressId", "channel", "status", "subtotal", "shippingFee", "total", "currency", "createdAt", "updatedAt"],
        properties: {
          id: { type: "integer", format: "int64" },
          orderNumber: { type: "string", description: "ORD-YYYYMMDD-XXXXX format" },
          customerId: { type: "integer", format: "int64" },
          addressId: { type: "integer", format: "int64" },
          channel: { type: "string", enum: ["web", "whatsapp"] },
          status: {
            type: "string",
            enum: ["new", "pending_payment", "payment_review", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"],
          },
          subtotal: { type: "string" },
          shippingFee: { type: "string" },
          total: { type: "string" },
          currency: { type: "string", default: "LKR" },
          customerNote: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      OrderDetailResponse: {
        allOf: [
          { $ref: "#/components/schemas/OrderResponse" },
          {
            type: "object",
            properties: {
              customer: {
                type: "object",
                properties: {
                  id: { type: "integer", format: "int64" },
                  fullName: { type: "string" },
                  phone: { type: "string" },
                  email: { type: "string", nullable: true },
                },
              },
              address: { $ref: "#/components/schemas/AddressResponse" },
              items: { type: "array", items: { $ref: "#/components/schemas/OrderItemResponse" } },
              payments: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "integer", format: "int64" },
                    method: { type: "string", enum: ["cod", "bank_transfer", "gateway"] },
                    state: { type: "string", enum: ["pending", "review", "verified", "rejected", "refunded"] },
                    amount: { type: "string" },
                    slipUrl: { type: "string", format: "uri", nullable: true },
                    createdAt: { type: "string", format: "date-time" },
                  },
                },
              },
            },
          },
        ],
      },
      CheckoutRequest: {
        type: "object",
        required: ["fullName", "phone", "addressLine1", "city", "district", "postalCode", "country", "deliveryPhone", "items", "paymentMethod"],
        properties: {
          fullName: { type: "string", maxLength: 255 },
          phone: { type: "string", maxLength: 20 },
          email: { type: "string", format: "email" },
          addressLine1: { type: "string", maxLength: 255 },
          addressLine2: { type: "string", maxLength: 255 },
          city: { type: "string", maxLength: 100 },
          district: { type: "string", maxLength: 100 },
          postalCode: { type: "string", maxLength: 20 },
          country: { type: "string", maxLength: 100 },
          deliveryPhone: { type: "string", maxLength: 20 },
          items: {
            type: "array",
            minItems: 1,
            items: {
              type: "object",
              required: ["variantId", "quantity"],
              properties: {
                variantId: { type: "string" },
                quantity: { type: "integer", minimum: 1 },
              },
            },
          },
          paymentMethod: { type: "string", enum: ["cod", "bank_transfer"] },
          bankTransferSlipUrl: { type: "string", format: "uri" },
          notes: { type: "string", maxLength: 500 },
        },
      },
      CheckoutResponse: {
        type: "object",
        required: ["orderNumber", "id", "customerId", "status", "subtotal", "shippingFee", "total", "paymentMethod", "message"],
        properties: {
          orderNumber: { type: "string" },
          id: { type: "integer", format: "int64" },
          customerId: { type: "integer", format: "int64" },
          status: { type: "string" },
          subtotal: { type: "string" },
          shippingFee: { type: "string" },
          total: { type: "string" },
          paymentMethod: { type: "string", enum: ["cod", "bank_transfer"] },
          message: { type: "string" },
        },
      },
      OrderStatusLookupRequest: {
        type: "object",
        required: ["orderNumber", "phone"],
        properties: {
          orderNumber: { type: "string" },
          phone: { type: "string" },
        },
      },
      PublicOrderResponse: {
        type: "object",
        required: ["orderNumber", "status", "total", "createdAt"],
        properties: {
          orderNumber: { type: "string" },
          status: { type: "string" },
          total: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
          customerName: { type: "string" },
        },
      },
      UpdateOrderStatusRequest: {
        type: "object",
        required: ["status"],
        properties: {
          status: {
            type: "string",
            enum: ["new", "pending_payment", "payment_review", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"],
          },
          notes: { type: "string" },
        },
      },
       PaginatedOrders: {
         type: "object",
         required: ["items", "total", "page", "pageSize", "totalPages"],
         properties: {
           items: { type: "array", items: { $ref: "#/components/schemas/OrderResponse" } },
           total: { type: "integer" },
           page: { type: "integer" },
           pageSize: { type: "integer" },
           totalPages: { type: "integer" },
         },
       },

       // ============ PHASE 6: PAYMENT SCHEMAS ============
       PaymentResponse: {
         type: "object",
         required: ["id", "orderId", "method", "state", "amount", "currency", "createdAt", "updatedAt"],
         properties: {
           id: { type: "integer", format: "int64" },
           orderId: { type: "integer", format: "int64" },
           method: { type: "string", enum: ["cod", "bank_transfer", "gateway"] },
           state: { type: "string", enum: ["pending", "review", "verified", "rejected", "refunded"] },
           amount: { type: "string", description: "Decimal as string" },
           currency: { type: "string", default: "LKR" },
           slipUrl: { type: "string", format: "uri", nullable: true },
           gatewayRef: { type: "string", nullable: true },
           createdAt: { type: "string", format: "date-time" },
           updatedAt: { type: "string", format: "date-time" },
         },
       },
       SlipUploadResponse: {
         type: "object",
         required: ["paymentId", "slipUrl", "state", "message"],
         properties: {
           paymentId: { type: "integer", format: "int64" },
           slipUrl: { type: "string", format: "uri" },
           state: { type: "string", enum: ["pending", "review", "verified", "rejected", "refunded"] },
           message: { type: "string" },
         },
       },
       VerifyPaymentRequest: {
         type: "object",
         properties: {
           notes: { type: "string" },
         },
       },
       RejectPaymentRequest: {
         type: "object",
         required: ["reason"],
         properties: {
           reason: { type: "string", maxLength: 500 },
         },
       },
       PaymentActionResponse: {
         type: "object",
         required: ["paymentId", "orderId", "state", "orderStatus", "message"],
         properties: {
           paymentId: { type: "integer", format: "int64" },
           orderId: { type: "integer", format: "int64" },
           state: { type: "string", enum: ["pending", "review", "verified", "rejected", "refunded"] },
           orderStatus: { type: "string" },
           message: { type: "string" },
         },
       },
       AdminPaymentDetailResponse: {
         allOf: [
           { $ref: "#/components/schemas/PaymentResponse" },
           {
             type: "object",
             properties: {
               order: {
                 type: "object",
                 required: ["id", "orderNumber", "status", "total", "customerName", "customerPhone"],
                 properties: {
                   id: { type: "integer", format: "int64" },
                   orderNumber: { type: "string" },
                   status: { type: "string" },
                   total: { type: "string" },
                   customerName: { type: "string" },
                   customerPhone: { type: "string" },
                 },
               },
             },
           },
         ],
       },
     },
   },
  paths: {
    // ============ HEALTH & VERSION ============
    "/health": {
      get: {
        tags: ["System"],
        summary: "Health check",
        responses: {
          "200": {
            description: "Service is healthy",
            content: { "application/json": { schema: { $ref: "#/components/schemas/HealthResponse" } } },
          },
        },
      },
    },
    "/version": {
      get: {
        tags: ["System"],
        summary: "Get service version",
        responses: {
          "200": {
            description: "OK",
            content: { "application/json": { schema: { $ref: "#/components/schemas/VersionResponse" } } },
          },
        },
      },
    },

    // ============ PHASE 2: AUTH ============
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login with email and password",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/LoginRequest" } } },
        },
        responses: {
          "200": {
            description: "Login successful",
            content: { "application/json": { schema: { $ref: "#/components/schemas/AuthResponse" } } },
          },
          "401": {
            description: "Invalid email or password",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ApiErrorBody" } } },
          },
          "400": {
            description: "Validation error",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ApiErrorBody" } } },
          },
        },
      },
    },
    "/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Get current authenticated user",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Current user info",
            content: { "application/json": { schema: { $ref: "#/components/schemas/UserResponse" } } },
          },
          "401": {
            description: "Not authenticated",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ApiErrorBody" } } },
          },
        },
      },
    },

    // ============ PHASE 3: PRODUCTS ============
    "/products": {
      get: {
        tags: ["Products"],
        summary: "List active products (public)",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "pageSize", in: "query", schema: { type: "integer", default: 20, maximum: 100 } },
        ],
        responses: {
          "200": {
            description: "List of products",
            content: { "application/json": { schema: { $ref: "#/components/schemas/PaginatedProducts" } } },
          },
        },
      },
    },
    "/products/{id}": {
      get: {
        tags: ["Products"],
        summary: "Get product details (public)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "int64" } }],
        responses: {
          "200": {
            description: "Product details with active variants",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/ProductResponse" },
                    {
                      type: "object",
                      properties: {
                        variants: { type: "array", items: { $ref: "#/components/schemas/VariantResponse" } },
                      },
                    },
                  ],
                },
              },
            },
          },
          "404": {
            description: "Product not found",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ApiErrorBody" } } },
          },
        },
      },
    },
    "/products/sku/{sku}": {
      get: {
        tags: ["Products"],
        summary: "Get variant by SKU (public)",
        parameters: [{ name: "sku", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": {
            description: "Variant details",
            content: { "application/json": { schema: { $ref: "#/components/schemas/VariantResponse" } } },
          },
          "404": {
            description: "Variant not found",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ApiErrorBody" } } },
          },
        },
      },
    },
    "/admin/products": {
      get: {
        tags: ["Admin - Products"],
        summary: "List all products including inactive (admin)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "pageSize", in: "query", schema: { type: "integer", default: 20, maximum: 100 } },
        ],
        responses: {
          "200": {
            description: "List of all products",
            content: { "application/json": { schema: { $ref: "#/components/schemas/PaginatedProducts" } } },
          },
          "401": {
            description: "Not authenticated",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ApiErrorBody" } } },
          },
          "403": {
            description: "Insufficient permissions",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ApiErrorBody" } } },
          },
        },
      },
      post: {
        tags: ["Admin - Products"],
        summary: "Create new product (admin)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/CreateProductRequest" } } },
        },
        responses: {
          "201": {
            description: "Product created",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ProductResponse" } } },
          },
          "400": {
            description: "Validation error",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ApiErrorBody" } } },
          },
          "401": {
            description: "Not authenticated",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ApiErrorBody" } } },
          },
        },
      },
    },
    "/admin/products/{id}": {
      patch: {
        tags: ["Admin - Products"],
        summary: "Update product (admin)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "int64" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/CreateProductRequest" } } },
        },
        responses: {
          "200": {
            description: "Product updated",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ProductResponse" } } },
          },
          "404": {
            description: "Product not found",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ApiErrorBody" } } },
          },
        },
      },
      delete: {
        tags: ["Admin - Products"],
        summary: "Deactivate product (admin)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "int64" } }],
        responses: {
          "200": {
            description: "Product deactivated",
            content: { "application/json": { schema: { type: "object", properties: { message: { type: "string" }, id: { type: "integer", format: "int64" } } } } },
          },
          "404": {
            description: "Product not found",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ApiErrorBody" } } },
          },
        },
      },
    },
    "/admin/products/{productId}/variants": {
      post: {
        tags: ["Admin - Products"],
        summary: "Create variant (admin)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "productId", in: "path", required: true, schema: { type: "string", format: "int64" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/CreateVariantRequest" } } },
        },
        responses: {
          "201": {
            description: "Variant created",
            content: { "application/json": { schema: { $ref: "#/components/schemas/VariantResponse" } } },
          },
          "404": {
            description: "Product not found",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ApiErrorBody" } } },
          },
          "409": {
            description: "Variant with this size/color already exists",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ApiErrorBody" } } },
          },
        },
      },
      get: {
        tags: ["Admin - Products"],
        summary: "List variants (admin, includes inactive)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "productId", in: "path", required: true, schema: { type: "string", format: "int64" } }],
        responses: {
          "200": {
            description: "List of variants",
            content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/VariantResponse" } } } },
          },
        },
      },
    },
    "/admin/variants/{id}": {
      patch: {
        tags: ["Admin - Products"],
        summary: "Update variant (admin)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "int64" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/CreateVariantRequest" } } },
        },
        responses: {
          "200": {
            description: "Variant updated",
            content: { "application/json": { schema: { $ref: "#/components/schemas/VariantResponse" } } },
          },
          "404": {
            description: "Variant not found",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ApiErrorBody" } } },
          },
        },
      },
    },

    // ============ PHASE 4: CUSTOMERS ============
    "/admin/customers": {
      get: {
        tags: ["Admin - Customers"],
        summary: "List customers with pagination and search (admin)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "pageSize", in: "query", schema: { type: "integer", default: 20, maximum: 100 } },
          { name: "search", in: "query", schema: { type: "string" }, description: "Search by name, phone, or email" },
        ],
        responses: {
          "200": {
            description: "List of customers",
            content: { "application/json": { schema: { $ref: "#/components/schemas/PaginatedCustomers" } } },
          },
          "401": {
            description: "Not authenticated",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ApiErrorBody" } } },
          },
        },
      },
    },
    "/admin/customers/{id}": {
      get: {
        tags: ["Admin - Customers"],
        summary: "Get customer details with addresses (admin)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "int64" } }],
        responses: {
          "200": {
            description: "Customer details",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/CustomerResponse" },
                    {
                      type: "object",
                      properties: {
                        addresses: { type: "array", items: { $ref: "#/components/schemas/AddressResponse" } },
                      },
                    },
                  ],
                },
              },
            },
          },
          "404": {
            description: "Customer not found",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ApiErrorBody" } } },
          },
        },
      },
    },
    "/admin/customers/{customerId}/addresses": {
      get: {
        tags: ["Admin - Customers"],
        summary: "List addresses for customer (admin)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "customerId", in: "path", required: true, schema: { type: "string", format: "int64" } }],
        responses: {
          "200": {
            description: "List of addresses",
            content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/AddressResponse" } } } },
          },
        },
      },
      post: {
        tags: ["Admin - Customers"],
        summary: "Create address for customer (admin)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "customerId", in: "path", required: true, schema: { type: "string", format: "int64" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/CreateAddressRequest" } } },
        },
        responses: {
          "201": {
            description: "Address created",
            content: { "application/json": { schema: { $ref: "#/components/schemas/AddressResponse" } } },
          },
          "404": {
            description: "Customer not found",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ApiErrorBody" } } },
          },
        },
      },
    },
    "/admin/customers/{customerId}/addresses/{addressId}": {
      patch: {
        tags: ["Admin - Customers"],
        summary: "Update address (admin)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "customerId", in: "path", required: true, schema: { type: "string", format: "int64" } },
          { name: "addressId", in: "path", required: true, schema: { type: "string", format: "int64" } },
        ],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/CreateAddressRequest" } } },
        },
        responses: {
          "200": {
            description: "Address updated",
            content: { "application/json": { schema: { $ref: "#/components/schemas/AddressResponse" } } },
          },
          "404": {
            description: "Address not found",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ApiErrorBody" } } },
          },
        },
      },
      delete: {
        tags: ["Admin - Customers"],
        summary: "Delete address (admin)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "customerId", in: "path", required: true, schema: { type: "string", format: "int64" } },
          { name: "addressId", in: "path", required: true, schema: { type: "string", format: "int64" } },
        ],
        responses: {
          "200": {
            description: "Address deleted",
            content: { "application/json": { schema: { type: "object", properties: { message: { type: "string" }, id: { type: "integer", format: "int64" } } } } },
          },
          "400": {
            description: "Cannot delete only address",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ApiErrorBody" } } },
          },
          "404": {
            description: "Address not found",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ApiErrorBody" } } },
          },
        },
      },
    },

    // ============ PHASE 5: ORDERS ============
    "/checkout": {
      post: {
        tags: ["Orders"],
        summary: "Create order from checkout (public)",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/CheckoutRequest" } } },
        },
        responses: {
          "201": {
            description: "Order created successfully",
            content: { "application/json": { schema: { $ref: "#/components/schemas/CheckoutResponse" } } },
          },
          "400": {
            description: "Validation error or invalid request",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ApiErrorBody" } } },
          },
          "404": {
            description: "Product or variant not found",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ApiErrorBody" } } },
          },
          "409": {
            description: "Out of stock",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ApiErrorBody" } } },
          },
        },
      },
    },
    "/orders/lookup": {
      post: {
        tags: ["Orders"],
        summary: "Lookup order status with phone verification (public)",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/OrderStatusLookupRequest" } } },
        },
        responses: {
          "200": {
            description: "Order status",
            content: { "application/json": { schema: { $ref: "#/components/schemas/PublicOrderResponse" } } },
          },
          "403": {
            description: "Phone number does not match order",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ApiErrorBody" } } },
          },
          "404": {
            description: "Order not found",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ApiErrorBody" } } },
          },
        },
      },
    },
    "/orders/{orderNumber}": {
      get: {
        tags: ["Orders"],
        summary: "Get order status (public)",
        parameters: [{ name: "orderNumber", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": {
            description: "Order status",
            content: { "application/json": { schema: { $ref: "#/components/schemas/PublicOrderResponse" } } },
          },
          "404": {
            description: "Order not found",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ApiErrorBody" } } },
          },
        },
      },
    },
    "/admin/orders": {
      get: {
        tags: ["Admin - Orders"],
        summary: "List orders with filtering (admin)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "pageSize", in: "query", schema: { type: "integer", default: 20, maximum: 100 } },
          {
            name: "status",
            in: "query",
            schema: {
              type: "string",
              enum: ["new", "pending_payment", "payment_review", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"],
            },
          },
          { name: "channel", in: "query", schema: { type: "string", enum: ["web", "whatsapp"] } },
        ],
        responses: {
          "200": {
            description: "List of orders",
            content: { "application/json": { schema: { $ref: "#/components/schemas/PaginatedOrders" } } },
          },
          "401": {
            description: "Not authenticated",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ApiErrorBody" } } },
          },
        },
      },
    },
    "/admin/orders/{id}": {
      get: {
        tags: ["Admin - Orders"],
        summary: "Get order details (admin)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "int64" } }],
        responses: {
          "200": {
            description: "Order details",
            content: { "application/json": { schema: { $ref: "#/components/schemas/OrderDetailResponse" } } },
          },
          "404": {
            description: "Order not found",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ApiErrorBody" } } },
          },
        },
      },
    },
    "/admin/orders/{id}/status": {
      patch: {
        tags: ["Admin - Orders"],
        summary: "Update order status (admin)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "int64" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateOrderStatusRequest" } } },
        },
        responses: {
          "200": {
            description: "Status updated",
            content: { "application/json": { schema: { type: "object", properties: { id: { type: "integer", format: "int64" }, orderNumber: { type: "string" }, status: { type: "string" }, message: { type: "string" } } } } },
          },
          "400": {
            description: "Invalid status transition",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ApiErrorBody" } } },
          },
          "404": {
            description: "Order not found",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ApiErrorBody" } } },
          },
        },
      },
    },
     "/admin/orders/{id}/notes": {
       post: {
         tags: ["Admin - Orders"],
         summary: "Add note to order (admin)",
         security: [{ bearerAuth: [] }],
         parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "int64" } }],
         requestBody: {
           required: true,
           content: { "application/json": { schema: { type: "object", required: ["note"], properties: { note: { type: "string", maxLength: 500 } } } } },
         },
         responses: {
           "200": {
             description: "Note added",
             content: { "application/json": { schema: { type: "object", properties: { message: { type: "string" }, id: { type: "integer", format: "int64" } } } } },
           },
           "404": {
             description: "Order not found",
             content: { "application/json": { schema: { $ref: "#/components/schemas/ApiErrorBody" } } },
           },
         },
       },
     },

     // ============ PHASE 6: PAYMENTS ============
     "/payments/slip": {
       post: {
         tags: ["Payments"],
         summary: "Upload payment slip (public)",
         description: "Upload a payment slip image for bank transfer. Returns slip URL and payment record.",
         parameters: [
           {
             name: "orderId",
             in: "query",
             required: true,
             schema: { type: "string", format: "int64" },
             description: "Order ID to attach slip to",
           },
         ],
         requestBody: {
           required: true,
           content: {
             "multipart/form-data": {
               schema: {
                 type: "object",
                 required: ["slip"],
                 properties: {
                   slip: {
                     type: "string",
                     format: "binary",
                     description: "Payment slip image (JPEG, PNG, WebP, or PDF, max 5MB)",
                   },
                 },
               },
             },
           },
         },
         responses: {
           "200": {
             description: "Slip uploaded successfully",
             content: { "application/json": { schema: { $ref: "#/components/schemas/SlipUploadResponse" } } },
           },
           "400": {
             description: "Invalid file or missing orderId",
             content: { "application/json": { schema: { $ref: "#/components/schemas/ApiErrorBody" } } },
           },
           "404": {
             description: "Order not found",
             content: { "application/json": { schema: { $ref: "#/components/schemas/ApiErrorBody" } } },
           },
         },
       },
     },
     "/admin/payments/{id}": {
       get: {
         tags: ["Admin - Payments"],
         summary: "Get payment details (admin)",
         security: [{ bearerAuth: [] }],
         parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "int64" } }],
         responses: {
           "200": {
             description: "Payment details",
             content: { "application/json": { schema: { $ref: "#/components/schemas/AdminPaymentDetailResponse" } } },
           },
           "401": {
             description: "Not authenticated",
             content: { "application/json": { schema: { $ref: "#/components/schemas/ApiErrorBody" } } },
           },
           "403": {
             description: "Admin role required",
             content: { "application/json": { schema: { $ref: "#/components/schemas/ApiErrorBody" } } },
           },
           "404": {
             description: "Payment not found",
             content: { "application/json": { schema: { $ref: "#/components/schemas/ApiErrorBody" } } },
           },
         },
       },
     },
     "/admin/payments/{id}/verify": {
       post: {
         tags: ["Admin - Payments"],
         summary: "Verify payment slip (admin)",
         description: "Verify a payment slip and update order status to confirmed.",
         security: [{ bearerAuth: [] }],
         parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "int64" } }],
         requestBody: {
           required: false,
           content: { "application/json": { schema: { $ref: "#/components/schemas/VerifyPaymentRequest" } } },
         },
         responses: {
           "200": {
             description: "Payment verified successfully",
             content: { "application/json": { schema: { $ref: "#/components/schemas/PaymentActionResponse" } } },
           },
           "400": {
             description: "Invalid payment state or request",
             content: { "application/json": { schema: { $ref: "#/components/schemas/ApiErrorBody" } } },
           },
           "401": {
             description: "Not authenticated",
             content: { "application/json": { schema: { $ref: "#/components/schemas/ApiErrorBody" } } },
           },
           "403": {
             description: "Admin role required",
             content: { "application/json": { schema: { $ref: "#/components/schemas/ApiErrorBody" } } },
           },
           "404": {
             description: "Payment not found",
             content: { "application/json": { schema: { $ref: "#/components/schemas/ApiErrorBody" } } },
           },
         },
       },
     },
     "/admin/payments/{id}/reject": {
       post: {
         tags: ["Admin - Payments"],
         summary: "Reject payment slip (admin)",
         description: "Reject a payment slip and revert order status to pending_payment.",
         security: [{ bearerAuth: [] }],
         parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "int64" } }],
         requestBody: {
           required: true,
           content: { "application/json": { schema: { $ref: "#/components/schemas/RejectPaymentRequest" } } },
         },
         responses: {
           "200": {
             description: "Payment rejected successfully",
             content: { "application/json": { schema: { $ref: "#/components/schemas/PaymentActionResponse" } } },
           },
           "400": {
             description: "Invalid payment state or request",
             content: { "application/json": { schema: { $ref: "#/components/schemas/ApiErrorBody" } } },
           },
           "401": {
             description: "Not authenticated",
             content: { "application/json": { schema: { $ref: "#/components/schemas/ApiErrorBody" } } },
           },
           "403": {
             description: "Admin role required",
             content: { "application/json": { schema: { $ref: "#/components/schemas/ApiErrorBody" } } },
           },
           "404": {
             description: "Payment not found",
             content: { "application/json": { schema: { $ref: "#/components/schemas/ApiErrorBody" } } },
           },
         },
       },
     },
   },
 } as const;
