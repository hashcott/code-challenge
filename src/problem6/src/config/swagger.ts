export const swaggerConfig = {
  openapi: {
    openapi: '3.0.0',
    info: {
      title: 'Scoreboard API',
      description: 'Real-time scoreboard system with live updates and security measures',
      version: '1.0.0',
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      },
      {
        url: 'https://scoreboard-system-mvp.onrender.com',
        description: 'Production server'
      }
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication endpoints'
      },
      {
        name: 'Scoreboard',
        description: 'Scoreboard management endpoints'
      },
      {
        name: 'System',
        description: 'System health and cache management'
      },
      {
        name: 'WebSocket',
        description: 'Real-time WebSocket connections'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Unique user identifier'
          },
          username: {
            type: 'string',
            description: 'User display name'
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address'
          },
          score: {
            type: 'integer',
            minimum: 0,
            description: 'User current score'
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'User creation timestamp'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Last update timestamp'
          }
        }
      },
      ScoreboardEntry: {
        type: 'object',
        properties: {
          rank: {
            type: 'integer',
            minimum: 1,
            description: 'User rank in scoreboard'
          },
          user: {
            $ref: '#/components/schemas/User'
          }
        }
      },
      Scoreboard: {
        type: 'object',
        properties: {
          scoreboard: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/ScoreboardEntry'
            },
            description: 'Top 10 users with highest scores'
          },
          totalUsers: {
            type: 'integer',
            description: 'Total number of users in system'
          },
          lastUpdated: {
            type: 'string',
            format: 'date-time',
            description: 'Last scoreboard update timestamp'
          }
        }
      },
      AuthRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address'
          },
          password: {
            type: 'string',
            minLength: 6,
            description: 'User password'
          }
        }
      },
      RegisterRequest: {
        type: 'object',
        required: ['username', 'email', 'password'],
        properties: {
          username: {
            type: 'string',
            minLength: 3,
            maxLength: 50,
            description: 'User display name'
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address'
          },
          password: {
            type: 'string',
            minLength: 6,
            description: 'User password'
          }
        }
      },
      AuthResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            description: 'Request success status'
          },
          data: {
            type: 'object',
            properties: {
              token: {
                type: 'string',
                description: 'JWT authentication token'
              },
              user: {
                $ref: '#/components/schemas/User'
              }
            }
          }
        }
      },
      ScoreUpdateRequest: {
        type: 'object',
        required: ['actionId', 'scoreIncrement', 'timestamp', 'actionHash'],
        properties: {
          actionId: {
            type: 'string',
            description: 'Unique action identifier'
          },
          scoreIncrement: {
            type: 'integer',
            minimum: 1,
            maximum: 1000,
            description: 'Score increment value'
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            description: 'Action timestamp'
          },
          actionHash: {
            type: 'string',
            description: 'Hash of the action to prevent tampering'
          }
        }
      },
      ActionData: {
        type: 'object',
        properties: {
          actionId: {
            type: 'string',
            description: 'Unique action identifier'
          },
          actionHash: {
            type: 'string',
            description: 'Hash of the action for verification'
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            description: 'Action creation timestamp'
          },
          expiresAt: {
            type: 'string',
            format: 'date-time',
            description: 'Action expiration timestamp'
          }
        }
      },
      HealthResponse: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['ok', 'error'],
            description: 'System health status'
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            description: 'Health check timestamp'
          },
          websocketConnections: {
            type: 'integer',
            description: 'Number of active WebSocket connections'
          },
          cache: {
            type: 'object',
            properties: {
              redis: {
                type: 'string',
                enum: ['connected', 'disconnected'],
                description: 'Redis connection status'
              },
              hitRate: {
                type: 'number',
                description: 'Cache hit rate percentage'
              },
              memoryUsage: {
                type: 'string',
                description: 'Redis memory usage'
              }
            }
          }
        }
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false,
            description: 'Request success status'
          },
          error: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description: 'Error code'
              },
              message: {
                type: 'string',
                description: 'Error message'
              }
            }
          }
        }
      },
      SuccessResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true,
            description: 'Request success status'
          },
          data: {
            type: 'object',
            description: 'Response data'
          }
        }
      }
    }
  }
  }
};

export const swaggerUiConfig = {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'full' as const,
    deepLinking: false
  },
  uiHooks: {
    onRequest: function (request: any, reply: any, next: any) {
      next();
    },
    preHandler: function (request: any, reply: any, next: any) {
      next();
    }
  },
  staticCSP: true,
  transformStaticCSP: (header: string) => header,
  transformSpecification: (swaggerObject: any, request: any, reply: any) => {
    return swaggerObject;
  },
  transformSpecificationClone: true
};