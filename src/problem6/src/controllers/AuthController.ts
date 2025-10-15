import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from '../services/AuthService';
import { AuthRequest, LoginRequest, AuthResponse } from '../types';
import { WebSocketService } from '../services/WebSocketService';
import { ScoreboardService } from '../services/ScoreboardService';
import { cacheService } from '../services/CacheService';

export class AuthController {
  static async register(
    request: FastifyRequest<{ Body: AuthRequest }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { username, email, password } = request.body;

      // Validate input
      if (!username || !email || !password) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'MISSING_FIELDS',
            message: 'Username, email, and password are required'
          }
        });
      }

      if (password.length < 6) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'WEAK_PASSWORD',
            message: 'Password must be at least 6 characters long'
          }
        });
      }

      const user = await AuthService.register({ username, email, password });
      
      // Generate JWT token
      const token = request.server.jwt.sign({
        userId: user.id,
        username: user.username,
        email: user.email
      });

      // Invalidate cache BEFORE sending response to ensure fresh data for next request
      await cacheService.invalidateScoreboard();
      
      const response: AuthResponse = {
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email
          }
        }
      };

      reply.status(201).send(response);

      // Broadcast scoreboard update via WebSocket after response is sent
      // Use setImmediate to ensure response is fully sent before broadcasting
      setImmediate(async () => {
        try {
          // Get fresh scoreboard and broadcast to all connected clients
          const scoreboard = await ScoreboardService.getTopScores(10);
          WebSocketService.broadcastScoreboardUpdate(scoreboard);
          
          console.log(`New user registered: ${username}. Scoreboard updated and broadcasted.`);
        } catch (wsError) {
          console.error('Failed to broadcast scoreboard update:', wsError);
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      
      reply.status(400).send({
        success: false,
        error: {
          code: 'REGISTRATION_FAILED',
          message: error instanceof Error ? error.message : 'Registration failed'
        }
      });
    }
  }

  static async login(
    request: FastifyRequest<{ Body: LoginRequest }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { email, password } = request.body;

      // Validate input
      if (!email || !password) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'MISSING_FIELDS',
            message: 'Email and password are required'
          }
        });
      }

      const user = await AuthService.login({ email, password });
      
      // Generate JWT token
      const token = request.server.jwt.sign({
        userId: user.id,
        username: user.username,
        email: user.email
      });

      const response: AuthResponse = {
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email
          }
        }
      };

      reply.send(response);
    } catch (error) {
      console.error('Login error:', error);
      
      reply.status(401).send({
        success: false,
        error: {
          code: 'LOGIN_FAILED',
          message: 'Invalid credentials'
        }
      });
    }
  }
}
