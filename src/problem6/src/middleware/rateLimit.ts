import type { FastifyRequest, FastifyReply } from 'fastify';
import { cacheService } from '../services/CacheService';

export interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
  keyGenerator?: (request: FastifyRequest) => string;
}

export class RateLimitMiddleware {
  static create(options: RateLimitOptions) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      const { maxRequests, windowMs, keyGenerator } = options;
      
      // Generate cache key for rate limiting
      const key = keyGenerator ? keyGenerator(request) : this.defaultKeyGenerator(request);
      
      try {
        // Get current request count
        const currentCount = await cacheService.getRateLimit(key);
        
        if (currentCount >= maxRequests) {
          reply.status(429).send({
            success: false,
            error: 'Too many requests',
            message: `Rate limit exceeded. Maximum ${maxRequests} requests per ${windowMs / 1000} seconds.`,
            retryAfter: Math.ceil(windowMs / 1000)
          });
          return;
        }
        
        // Increment request count
        await cacheService.incrementRateLimit(key, Math.ceil(windowMs / 1000));
        
        // Add rate limit headers
        reply.header('X-RateLimit-Limit', maxRequests);
        reply.header('X-RateLimit-Remaining', Math.max(0, maxRequests - currentCount - 1));
        reply.header('X-RateLimit-Reset', new Date(Date.now() + windowMs).toISOString());
        
      } catch (error) {
        console.error('Rate limit middleware error:', error);
        // Continue without rate limiting if cache fails
      }
    };
  }
  
  private static defaultKeyGenerator(request: FastifyRequest): string {
    const ip = request.ip || request.headers['x-forwarded-for'] || 'unknown';
    const userId = (request as any).user?.id || 'anonymous';
    return `rate_limit:${userId}:${ip}`;
  }
}

// Pre-configured rate limiters
export const rateLimiters = {
  // General API rate limiting
  general: RateLimitMiddleware.create({
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
    keyGenerator: (request) => {
      const ip = request.ip || request.headers['x-forwarded-for'] || 'unknown';
      return `rate_limit:general:${ip}`;
    }
  }),
  
  // Score update rate limiting (more restrictive)
  scoreUpdate: RateLimitMiddleware.create({
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
    keyGenerator: (request) => {
      const userId = (request as any).user?.id || 'anonymous';
      return `rate_limit:score_update:${userId}`;
    }
  }),
  
  // Authentication rate limiting
  auth: RateLimitMiddleware.create({
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    keyGenerator: (request) => {
      const ip = request.ip || request.headers['x-forwarded-for'] || 'unknown';
      return `rate_limit:auth:${ip}`;
    }
  }),
  
  // Cache management rate limiting (admin only)
  cacheManagement: RateLimitMiddleware.create({
    maxRequests: 20,
    windowMs: 60 * 1000, // 1 minute
    keyGenerator: (request) => {
      const userId = (request as any).user?.id || 'anonymous';
      return `rate_limit:cache:${userId}`;
    }
  })
};
