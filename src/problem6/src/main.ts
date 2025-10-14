import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import websocket from '@fastify/websocket';
// Removed @fastify/rate-limit - using custom cache-based rate limiting instead
import staticFiles from '@fastify/static';
import path from 'path';

import { AuthController } from './controllers/AuthController';
import { ScoreboardController } from './controllers/ScoreboardController';
import { WebSocketService } from './services/WebSocketService';
import { cacheService } from './services/CacheService';
import { authenticateToken } from './middleware/auth';
import { rateLimiters } from './middleware/rateLimit';

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

  await fastify.register(staticFiles, {
    root: path.join(__dirname, '../public'),
    prefix: '/'
  });

// Health check endpoint
fastify.get('/health', async (request, reply) => {
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
fastify.get('/api/cache/stats', { preHandler: [authenticateToken, rateLimiters.cacheManagement] }, async (request, reply) => {
  const stats = await cacheService.getCacheStats();
  return {
    success: true,
    data: stats
  };
});

fastify.post('/api/cache/warm', { preHandler: [authenticateToken, rateLimiters.cacheManagement] }, async (request, reply) => {
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

fastify.delete('/api/cache/clear', { preHandler: [authenticateToken, rateLimiters.cacheManagement] }, async (request, reply) => {
  await cacheService.invalidateAll();
  return {
    success: true,
    data: {
      message: 'Cache cleared successfully',
      keysDeleted: 'all'
    }
  };
});

  // Auth routes with rate limiting
  fastify.post('/api/auth/register', { preHandler: rateLimiters.auth }, async (request, reply) => {
    return await AuthController.register(request as any, reply);
  });
  fastify.post('/api/auth/login', { preHandler: rateLimiters.auth }, async (request, reply) => {
    return await AuthController.login(request as any, reply);
  });

  // Public scoreboard route
  fastify.get('/api/scoreboard', ScoreboardController.getScoreboard);

  // Protected scoreboard routes with rate limiting
  fastify.post('/api/scoreboard/update', {
    preHandler: [authenticateToken, rateLimiters.scoreUpdate]
  }, async (request, reply) => {
    return await ScoreboardController.updateScore(request as any, reply);
  });

  fastify.get('/api/scoreboard/user/:userId', {
    preHandler: [authenticateToken, rateLimiters.general]
  }, async (request, reply) => {
    return await ScoreboardController.getUserScore(request as any, reply);
  });

  // Generate action data (for frontend)
  fastify.post('/api/scoreboard/generate-action', {
    preHandler: [authenticateToken, rateLimiters.general]
  }, async (request, reply) => {
    return await ScoreboardController.generateActionData(request as any, reply);
  });

  // WebSocket endpoint
  fastify.register(async function (fastify) {
    fastify.get('/ws', { websocket: true }, (connection, req) => {
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
