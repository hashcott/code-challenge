import Redis from 'ioredis';

// Cached version of ScoreboardEntry with string dates for JSON serialization
export interface CachedScoreboardEntry {
  rank: number;
  userId: string;
  username: string;
  score: number;
  lastUpdated: string;
}

export interface CacheStats {
  redis: {
    status: string;
    hitRate: number;
    memoryUsage: string;
    keyspace: {
      scoreboard: number;
      user_scores: number;
      sessions: number;
      rate_limits: number;
    };
  };
  memory: {
    used: string;
    free: string;
    hitRate: number;
  };
  performance: {
    avgResponseTime: number;
    cacheHitRatio: number;
    missRatio: number;
  };
}


export class CacheService {
  private redis: Redis;
  private memoryCache = new Map<string, { value: any; expires: number }>();
  private stats = {
    hits: 0,
    misses: 0,
    totalRequests: 0
  };

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    this.setupRedisEventHandlers();
  }

  private setupRedisEventHandlers() {
    this.redis.on('connect', () => {
      console.log('Redis connected successfully');
    });

    this.redis.on('error', (error: any) => {
      console.error('Redis connection error:', error);
    });
  }

  // ===== SCOREBOARD CACHING =====
  async getScoreboard(): Promise<CachedScoreboardEntry[] | null> {
    try {
      const cached = await this.redis.get('scoreboard:top10');
      this.recordCacheAccess(!!cached);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Error getting scoreboard from cache:', error);
      return null;
    }
  }

  async setScoreboard(scoreboard: CachedScoreboardEntry[], ttl: number = 30): Promise<void> {
    try {
      await this.redis.setex('scoreboard:top10', ttl, JSON.stringify(scoreboard));
      // Also update memory cache
      this.setInMemory('scoreboard:top10', scoreboard, ttl * 1000);
    } catch (error) {
      console.error('Error setting scoreboard cache:', error);
    }
  }

  // ===== USER SCORE CACHING =====
  async getUserScore(userId: string): Promise<number | null> {
    try {
      const cached = await this.redis.get(`user:${userId}:score`);
      this.recordCacheAccess(!!cached);
      return cached ? parseInt(cached) : null;
    } catch (error) {
      console.error('Error getting user score from cache:', error);
      return null;
    }
  }

  async setUserScore(userId: string, score: number, ttl: number = 300): Promise<void> {
    try {
      await this.redis.setex(`user:${userId}:score`, ttl, score.toString());
      this.setInMemory(`user:${userId}:score`, score, ttl * 1000);
    } catch (error) {
      console.error('Error setting user score cache:', error);
    }
  }

  // ===== SESSION CACHING =====
  async getSession(sessionId: string): Promise<any | null> {
    try {
      const cached = await this.redis.get(`session:${sessionId}`);
      this.recordCacheAccess(!!cached);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Error getting session from cache:', error);
      return null;
    }
  }

  async setSession(sessionId: string, data: any, ttl: number = 86400): Promise<void> {
    try {
      await this.redis.setex(`session:${sessionId}`, ttl, JSON.stringify(data));
      this.setInMemory(`session:${sessionId}`, data, ttl * 1000);
    } catch (error) {
      console.error('Error setting session cache:', error);
    }
  }

  // ===== RATE LIMITING CACHE =====
  async getRateLimit(key: string): Promise<number> {
    try {
      const count = await this.redis.get(`rate_limit:${key}`);
      this.recordCacheAccess(!!count);
      return count ? parseInt(count) : 0;
    } catch (error) {
      console.error('Error getting rate limit from cache:', error);
      return 0;
    }
  }

  async incrementRateLimit(key: string, ttl: number = 60): Promise<number> {
    try {
      const multi = this.redis.multi();
      multi.incr(`rate_limit:${key}`);
      multi.expire(`rate_limit:${key}`, ttl);
      const results = await multi.exec();
      return results?.[0]?.[1] as number || 0;
    } catch (error) {
      console.error('Error incrementing rate limit:', error);
      return 0;
    }
  }

  // ===== MEMORY CACHE =====
  getFromMemory(key: string): any | null {
    const item = this.memoryCache.get(key);
    if (!item) {
      this.recordCacheAccess(false);
      return null;
    }

    if (Date.now() > item.expires) {
      this.memoryCache.delete(key);
      this.recordCacheAccess(false);
      return null;
    }

    this.recordCacheAccess(true);
    return item.value;
  }

  setInMemory(key: string, value: any, ttl: number = 300000): void {
    this.memoryCache.set(key, {
      value,
      expires: Date.now() + ttl
    });
  }

  // ===== CACHE INVALIDATION =====
  async invalidateScoreboard(): Promise<void> {
    try {
      await this.redis.del('scoreboard:top10');
      this.memoryCache.delete('scoreboard:top10');
    } catch (error) {
      console.error('Error invalidating scoreboard cache:', error);
    }
  }

  async invalidateUserScore(userId: string): Promise<void> {
    try {
      await this.redis.del(`user:${userId}:score`);
      this.memoryCache.delete(`user:${userId}:score`);
    } catch (error) {
      console.error('Error invalidating user score cache:', error);
    }
  }

  async invalidateAll(): Promise<void> {
    try {
      await this.redis.flushall();
      this.memoryCache.clear();
    } catch (error) {
      console.error('Error clearing all cache:', error);
    }
  }

  // ===== CACHE WARMING =====
  async warmCache(): Promise<{ itemsCached: number; duration: number }> {
    const startTime = Date.now();
    let itemsCached = 0;

    try {
      // This would be implemented based on your ScoreboardService
      // const scoreboard = await ScoreboardService.getTopScores(10);
      // await this.setScoreboard(scoreboard);
      // itemsCached++;

      console.log('Cache warming completed');
    } catch (error) {
      console.error('Error warming cache:', error);
    }

    const duration = Date.now() - startTime;
    return { itemsCached, duration };
  }

  // ===== CACHE STATISTICS =====
  async getCacheStats(): Promise<CacheStats> {
    try {
      const redisInfo = await this.redis.info('memory');
      const keyspaceInfo = await this.redis.info('keyspace');

      const hitRate = this.calculateHitRate();
      const memoryUsage = this.getMemoryUsage();

      return {
        redis: {
          status: 'connected',
          hitRate: hitRate,
          memoryUsage: this.parseMemoryUsage(redisInfo),
          keyspace: this.parseKeyspaceInfo(keyspaceInfo)
        },
        memory: {
          used: memoryUsage.used,
          free: memoryUsage.free,
          hitRate: hitRate
        },
        performance: {
          avgResponseTime: this.calculateAvgResponseTime(),
          cacheHitRatio: hitRate / 100,
          missRatio: (100 - hitRate) / 100
        }
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return {
        redis: {
          status: 'disconnected',
          hitRate: 0,
          memoryUsage: '0MB',
          keyspace: { scoreboard: 0, user_scores: 0, sessions: 0, rate_limits: 0 }
        },
        memory: { used: '0MB', free: '0MB', hitRate: 0 },
        performance: { avgResponseTime: 0, cacheHitRatio: 0, missRatio: 1 }
      };
    }
  }

  private recordCacheAccess(hit: boolean): void {
    this.stats.totalRequests++;
    if (hit) {
      this.stats.hits++;
    } else {
      this.stats.misses++;
    }
  }

  private calculateHitRate(): number {
    if (this.stats.totalRequests === 0) return 0;
    return (this.stats.hits / this.stats.totalRequests) * 100;
  }

  private getMemoryUsage(): { used: string; free: string } {
    const used = process.memoryUsage();
    const free = used.heapTotal - used.heapUsed;
    
    return {
      used: `${Math.round(used.heapUsed / 1024 / 1024)}MB`,
      free: `${Math.round(free / 1024 / 1024)}MB`
    };
  }

  private parseMemoryUsage(redisInfo: string): string {
    const match = redisInfo.match(/used_memory_human:([^\r\n]+)/);
    return match ? match[1] : '0MB';
  }

  private parseKeyspaceInfo(keyspaceInfo: string): { scoreboard: number; user_scores: number; sessions: number; rate_limits: number } {
    const keyspace = { scoreboard: 0, user_scores: 0, sessions: 0, rate_limits: 0 };
    
    // This is a simplified parser - in reality you'd need more sophisticated parsing
    const db0Match = keyspaceInfo.match(/db0:keys=(\d+)/);
    if (db0Match) {
      const totalKeys = parseInt(db0Match[1]);
      // Estimate distribution (this would be more accurate with actual key counting)
      keyspace.scoreboard = 1;
      keyspace.user_scores = Math.floor(totalKeys * 0.6);
      keyspace.sessions = Math.floor(totalKeys * 0.2);
      keyspace.rate_limits = Math.floor(totalKeys * 0.2);
    }
    
    return keyspace;
  }

  private calculateAvgResponseTime(): number {
    // This would be implemented with actual response time tracking
    return 15; // Mock value
  }

  // ===== CACHE-ASIDE PATTERN =====
  async getOrSet<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    ttl: number = 300
  ): Promise<T> {
    // Try memory cache first
    let value = this.getFromMemory(key);
    if (value) return value;

    // Try Redis cache
    value = await this.redis.get(key);
    if (value) {
      const parsedValue = JSON.parse(value);
      this.setInMemory(key, parsedValue, ttl * 1000);
      return parsedValue;
    }

    // Cache miss - fetch from source
    value = await fetchFunction();
    
    // Update all cache levels
    await this.redis.setex(key, ttl, JSON.stringify(value));
    this.setInMemory(key, value, ttl * 1000);
    
    return value;
  }

  // ===== CLEANUP =====
  async disconnect(): Promise<void> {
    await this.redis.disconnect();
    this.memoryCache.clear();
  }
}

// Singleton instance
export const cacheService = new CacheService();
