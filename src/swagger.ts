export const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "BiteSpeed Identity Reconciliation API",
    version: "1.0.0",
    description:
      "Service to identify and keep track of a customer's identity across multiple purchases using different contact information.",
  },
  paths: {
    "/": {
      get: {
        summary: "Health check",
        responses: {
          "200": {
            description: "Service is healthy",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "healthy" },
                    service: {
                      type: "string",
                      example: "BiteSpeed Identity Reconciliation",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/identify": {
      post: {
        summary: "Identify and reconcile a contact",
        description:
          "Accepts an email and/or phone number, finds or creates contact records, and returns the consolidated identity cluster.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  email: {
                    type: "string",
                    nullable: true,
                    example: "mcfly@hillvalley.edu",
                  },
                  phoneNumber: {
                    type: "string",
                    nullable: true,
                    example: "123456",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Consolidated contact identity",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    contact: {
                      type: "object",
                      properties: {
                        primaryContatctId: { type: "integer", example: 1 },
                        emails: {
                          type: "array",
                          items: { type: "string" },
                          example: [
                            "lorraine@hillvalley.edu",
                            "mcfly@hillvalley.edu",
                          ],
                        },
                        phoneNumbers: {
                          type: "array",
                          items: { type: "string" },
                          example: ["123456"],
                        },
                        secondaryContactIds: {
                          type: "array",
                          items: { type: "integer" },
                          example: [23],
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          "400": {
            description: "Validation error",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};
