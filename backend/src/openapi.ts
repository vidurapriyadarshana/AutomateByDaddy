// Minimal, hand-maintained OpenAPI spec for the endpoints that exist today.
// Keep this file small and accurate; expand it as real routes are added.

export const openapiDocument = {
  openapi: "3.0.3",
  info: {
    title: "Backend API",
    version: "0.1.0",
  },
  servers: [{ url: "/" }],
  components: {
    schemas: {
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
            additionalProperties: false,
            required: ["message"],
            properties: {
              message: { type: "string" },
              code: { type: "string" },
              requestId: { type: "string" },
              details: {},
            },
          },
        },
      },
    },
  },
  paths: {
    "/health": {
      get: {
        summary: "Health check",
        responses: {
          "200": {
            description: "OK",
            headers: {
              "x-request-id": {
                description: "Request correlation id",
                schema: { type: "string" },
              },
            },
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/HealthResponse" },
              },
            },
          },
        },
      },
    },
    "/version": {
      get: {
        summary: "Service version",
        responses: {
          "200": {
            description: "OK",
            headers: {
              "x-request-id": {
                description: "Request correlation id",
                schema: { type: "string" },
              },
            },
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/VersionResponse" },
              },
            },
          },
        },
      },
    },
  },
} as const;
