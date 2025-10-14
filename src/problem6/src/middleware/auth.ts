import { FastifyRequest, FastifyReply } from 'fastify';
import { JWTPayload } from '../types';

export interface AuthenticatedRequest extends FastifyRequest {
  user: {
    userId: string;
    username: string;
    email: string;
  };
}

export async function authenticateToken(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const token = request.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return reply.status(401).send({
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: 'Authorization token is required'
        }
      });
    }

    const decoded = request.server.jwt.verify(token) as JWTPayload;
    
    // Add user info to request
    (request as AuthenticatedRequest).user = {
      userId: decoded.userId,
      username: decoded.username,
      email: decoded.email
    };
  } catch (error) {
    return reply.status(401).send({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired token'
      }
    });
  }
}

export async function optionalAuth(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const token = request.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      const decoded = request.server.jwt.verify(token) as JWTPayload;
      (request as AuthenticatedRequest).user = {
        userId: decoded.userId,
        username: decoded.username,
        email: decoded.email
      };
    }
  } catch (error) {
    // Optional auth - don't throw error if token is invalid
    console.log('Optional auth failed:', error);
  }
}
