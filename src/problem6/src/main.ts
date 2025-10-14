import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import websocket from '@fastify/websocket';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
// Removed @fastify/rate-limit - using custom cache-based rate limiting instead
import staticFiles from '@fastify/static';
import path from 'path';

import { AuthController } from './controllers/AuthController';
import { ScoreboardController } from './controllers/ScoreboardController';
import { WebSocketService } from './services/WebSocketService';
import { cacheService } from './services/CacheService';
import { authenticateToken } from './middleware/auth';
import { rateLimiters } from './middleware/rateLimit';
import { swaggerConfig, swaggerUiConfig } from './config/swagger';

const fastify = Fastify({
  logger: {
    level: 'info'
  }
});

async function build() {
  // Register plugins
  await fastify.register(cors, {
    origin: true,
    credentials: true
  });

  await fastify.register(jwt, {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'
  });

  await fastify.register(websocket);

  // Register Swagger
  await fastify.register(swagger, swaggerConfig as any);
  await fastify.register(swaggerUi, swaggerUiConfig);

  await fastify.register(staticFiles, {
    root: path.join(__dirname, '../public'),
    prefix: '/'
  });

// Health check endpoint
fastify.get('/health', {
  schema: {
    tags: ['System'],
    summary: 'Health check endpoint',
    description: 'Returns system health status including cache and WebSocket connections',
    response: {
      200: {
        type: 'object',
        description: 'System health status',
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
      }
    }
  }
}, async (request, reply) => {
  const cacheStats = await cacheService.getCacheStats();
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    websocketConnections: WebSocketService.getConnectionCount(),
    cache: {
      redis: cacheStats.redis.status,
      hitRate: cacheStats.redis.hitRate,
      memoryUsage: cacheStats.redis.memoryUsage
    }
  };
});

// Cache management endpoints with rate limiting
fastify.get('/api/cache/stats', {
  preHandler: [authenticateToken, rateLimiters.cacheManagement],
  schema: {
    tags: ['System'],
    summary: 'Get cache statistics',
    description: 'Returns detailed cache statistics including Redis status and performance metrics',
    security: [{ bearerAuth: [] }],
    response: {
      200: {
        type: 'object',
        description: 'Cache statistics',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              redis: {
                type: 'object',
                properties: {
                  status: { type: 'string', enum: ['connected', 'disconnected'] },
                  hitRate: { type: 'number' },
                  memoryUsage: { type: 'string' }
                }
              }
            }
          }
        }
      },
      401: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' }
            }
          }
        }
      },
      429: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' }
            }
          }
        }
      }
    }
  }
}, async (request, reply) => {
  const stats = await cacheService.getCacheStats();
  return {
    success: true,
    data: stats
  };
});

fastify.post('/api/cache/warm', {
  preHandler: [authenticateToken, rateLimiters.cacheManagement],
  schema: {
    tags: ['System'],
    summary: 'Warm cache',
    description: 'Pre-populate cache with frequently accessed data',
    security: [{ bearerAuth: [] }],
    response: {
      200: {
        type: 'object',
        description: 'Cache warming result',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              message: { type: 'string', example: 'Cache warmed successfully' },
              itemsCached: { type: 'integer' },
              duration: { type: 'string' }
            }
          }
        }
      },
      401: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' }
            }
          }
        }
      },
      429: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' }
            }
          }
        }
      }
    }
  }
}, async (request, reply) => {
  const result = await cacheService.warmCache();
  return {
    success: true,
    data: {
      message: 'Cache warmed successfully',
      itemsCached: result.itemsCached,
      duration: `${(result.duration / 1000).toFixed(1)}s`
    }
  };
});

fastify.delete('/api/cache/clear', {
  preHandler: [authenticateToken, rateLimiters.cacheManagement],
  schema: {
    tags: ['System'],
    summary: 'Clear cache',
    description: 'Invalidate all cached data',
    security: [{ bearerAuth: [] }],
    response: {
      200: {
        type: 'object',
        description: 'Cache clearing result',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              message: { type: 'string', example: 'Cache cleared successfully' },
              keysDeleted: { type: 'string', example: 'all' }
            }
          }
        }
      },
      401: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' }
            }
          }
        }
      },
      429: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' }
            }
          }
        }
      }
    }
  }
}, async (request, reply) => {
  await cacheService.invalidateAll();
  return {
    success: true,
    data: {
      message: 'Cache cleared successfully',
      keysDeleted: 'all'
    }
  };
});

  // Auth routes without rate limiting
  fastify.post('/api/auth/register', {
    schema: {
      tags: ['Authentication'],
      summary: 'Register new user',
      description: 'Create a new user account with username, email and password',
      body: {
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
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                token: { type: 'string' },
                user: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    username: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    score: { type: 'integer', minimum: 0 },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' }
                  }
                }
              }
            }
          }
        },
        400: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' }
              }
            }
          }
        },
        409: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    return await AuthController.register(request as any, reply);
  });
  
  fastify.post('/api/auth/login', {
    schema: {
      tags: ['Authentication'],
      summary: 'User login',
      description: 'Authenticate user with email and password',
      body: {
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
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                token: { type: 'string' },
                user: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    username: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    score: { type: 'integer', minimum: 0 },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' }
                  }
                }
              }
            }
          }
        },
        400: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' }
              }
            }
          }
        },
        401: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    return await AuthController.login(request as any, reply);
  });

  // Public scoreboard route
  fastify.get('/api/scoreboard', {
    schema: {
      tags: ['Scoreboard'],
      summary: 'Get scoreboard',
      description: 'Get top 10 users with highest scores (public endpoint)',
      response: {
        200: {
          type: 'object',
          properties: {
            scoreboard: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  rank: { type: 'integer', minimum: 1 },
                  user: {
                    type: 'object',
                    properties: {
                      id: { type: 'string', format: 'uuid' },
                      username: { type: 'string' },
                      email: { type: 'string', format: 'email' },
                      score: { type: 'integer', minimum: 0 },
                      createdAt: { type: 'string', format: 'date-time' },
                      updatedAt: { type: 'string', format: 'date-time' }
                    }
                  }
                }
              }
            },
            totalUsers: { type: 'integer' },
            lastUpdated: { type: 'string', format: 'date-time' }
          }
        },
        500: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, ScoreboardController.getScoreboard);

  // Protected scoreboard routes with rate limiting
  fastify.post('/api/scoreboard/update', {
    preHandler: [authenticateToken, rateLimiters.scoreUpdate],
    schema: {
      tags: ['Scoreboard'],
      summary: 'Update user score',
      description: 'Update user score with action hash verification for security',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['actionHash', 'score'],
        properties: {
          actionHash: {
            type: 'string',
            description: 'Hash of the action to prevent tampering'
          },
          score: {
            type: 'integer',
            minimum: 0,
            description: 'New score value'
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'object' }
          }
        },
        400: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' }
              }
            }
          }
        },
        401: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' }
              }
            }
          }
        },
        429: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    return await ScoreboardController.updateScore(request as any, reply);
  });

  fastify.get('/api/scoreboard/user/:userId', {
    preHandler: [authenticateToken, rateLimiters.general],
    schema: {
      tags: ['Scoreboard'],
      summary: 'Get user score',
      description: 'Get specific user score by user ID',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          userId: {
            type: 'string',
            format: 'uuid',
            description: 'User ID'
          }
        },
        required: ['userId']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                user: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    username: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    score: { type: 'integer', minimum: 0 },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' }
                  }
                },
                rank: { type: 'integer', description: 'User rank in scoreboard' }
              }
            }
          }
        },
        401: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' }
              }
            }
          }
        },
        404: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' }
              }
            }
          }
        },
        429: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    return await ScoreboardController.getUserScore(request as any, reply);
  });

  // Generate action data (for frontend)
  fastify.post('/api/scoreboard/generate-action', {
    preHandler: [authenticateToken, rateLimiters.general],
    schema: {
      tags: ['Scoreboard'],
      summary: 'Generate action data',
      description: 'Generate action hash and data for secure score updates',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                actionId: { type: 'string' },
                actionHash: { type: 'string' },
                timestamp: { type: 'string', format: 'date-time' },
                expiresAt: { type: 'string', format: 'date-time' }
              }
            }
          }
        },
        401: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' }
              }
            }
          }
        },
        429: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    return await ScoreboardController.generateActionData(request as any, reply);
  });

  // WebSocket endpoint
  fastify.register(async function (fastify) {
    fastify.get('/ws', {
      websocket: true
    }, (connection, req) => {
      const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      WebSocketService.addConnection(connectionId, connection.socket);

      connection.socket.on('message', (message: any) => {
        try {
          const data = JSON.parse(message.toString());
          console.log('WebSocket message received:', data);
          
          // Echo back connection status
          WebSocketService.broadcastConnectionStatus('connected', data.userId);
        } catch (error) {
          console.error('WebSocket message error:', error);
          WebSocketService.broadcastError('Invalid message format');
        }
      });

      connection.socket.on('close', () => {
        WebSocketService.removeConnection(connectionId);
        console.log(`WebSocket connection closed: ${connectionId}`);
      });

      connection.socket.on('error', (error: any) => {
        console.error(`WebSocket error for connection ${connectionId}:`, error);
        WebSocketService.removeConnection(connectionId);
      });

      // Send initial connection status
      connection.socket.send(JSON.stringify({
        type: 'connection_status',
        data: {
          status: 'connected',
          connectionId,
          timestamp: new Date()
        },
        timestamp: new Date()
      }));
    });
  });

  // Error handler
  fastify.setErrorHandler((error, request, reply) => {
    fastify.log.error(error);
    
    reply.status(500).send({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error'
      }
    });
  });

  return fastify;
}

async function start() {
  try {
    const app = await build();
    
    const port = parseInt(process.env.PORT || '3000');
    const host = process.env.HOST || '0.0.0.0';
    
    await app.listen({ port, host });
    
    console.log(`🚀 Scoreboard API server running on http://${host}:${port}`);
    console.log(`📊 WebSocket endpoint: ws://${host}:${port}/ws`);
    console.log(`🌐 Frontend demo: http://${host}:${port}/`);
    console.log(`📚 API Documentation: http://${host}:${port}/docs`);
    
  } catch (err) {
    console.error('Error starting server:', err);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down server...');
  process.exit(0);
});

start();