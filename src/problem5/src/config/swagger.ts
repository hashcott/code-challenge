import swaggerJsdoc from 'swagger-jsdoc';
import { Express } from 'express';
import swaggerUi from 'swagger-ui-express';

/**
 * Swagger configuration options
 */
const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Express TypeScript CRUD API',
      version: '1.0.0',
      description: 'A comprehensive CRUD API built with Express 5.x, TypeScript 5.x, and SQLite database',
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
      }
    ],
    components: {
      schemas: {
        User: {
          type: 'object',
          required: ['name', 'email'],
          properties: {
            id: {
              type: 'integer',
              description: 'User unique identifier',
              example: 1
            },
            name: {
              type: 'string',
              description: 'User full name',
              example: 'John Doe'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
              example: 'john@example.com'
            },
            age: {
              type: 'integer',
              description: 'User age',
              example: 30,
              minimum: 0,
              maximum: 150
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'User creation timestamp',
              example: '2023-12-01T10:00:00.000Z'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'User last update timestamp',
              example: '2023-12-01T10:00:00.000Z'
            }
          }
        },
        CreateUserRequest: {
          type: 'object',
          required: ['name', 'email'],
          properties: {
            name: {
              type: 'string',
              description: 'User full name',
              example: 'John Doe'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
              example: 'john@example.com'
            },
            age: {
              type: 'integer',
              description: 'User age',
              example: 30,
              minimum: 0,
              maximum: 150
            }
          }
        },
        UpdateUserRequest: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'User full name',
              example: 'John Smith'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
              example: 'john.smith@example.com'
            },
            age: {
              type: 'integer',
              description: 'User age',
              example: 31,
              minimum: 0,
              maximum: 150
            }
          }
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Indicates if the request was successful',
              example: true
            },
            data: {
              type: 'object',
              description: 'Response data'
            },
            message: {
              type: 'string',
              description: 'Response message',
              example: 'Operation completed successfully'
            },
            count: {
              type: 'integer',
              description: 'Number of items returned',
              example: 1
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Indicates if the request was successful',
              example: false
            },
            message: {
              type: 'string',
              description: 'Error message',
              example: 'User not found'
            },
            error: {
              type: 'string',
              description: 'Detailed error information',
              example: 'Validation failed'
            }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts', './main.ts']
};

/**
 * Initialize Swagger documentation
 * @param app Express application instance
 */
export function setupSwagger(app: Express): void {
  const specs = swaggerJsdoc(options);
  
  // Swagger UI endpoint
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Express TypeScript CRUD API Documentation'
  }));

  // JSON endpoint for OpenAPI spec
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });
}
