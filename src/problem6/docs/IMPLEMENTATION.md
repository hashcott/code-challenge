# Implementation Guide

## Quick Start

### Prerequisites
- Node.js 18+ 
- Docker & Docker Compose
- Git

### Using Docker (Recommended)

```bash
cd docker
make dev
make db-migrate
```

### Local Development

```bash
npm install
cp config/dev/env.example .env
npm run db:generate
npm run db:push
npm run dev
```

## Project Structure

```
src/problem6/
├── src/                    # Source code
│   ├── main.ts            # Application entry point
│   ├── controllers/       # API controllers
│   ├── services/          # Business logic
│   ├── middleware/        # Authentication middleware
│   └── types/             # TypeScript definitions
├── prisma/                # Database schema
├── public/                # Frontend demo
├── docker/                # Docker configuration
├── config/                # Environment configs
└── docs/                  # Documentation
```

## Environment Configuration

### Development (.env)
```env
DATABASE_URL="postgresql://scoreboard_user:scoreboard_password@localhost:5432/scoreboard_dev"
JWT_SECRET="dev-jwt-secret-key"
PORT=3000
HOST=0.0.0.0
NODE_ENV=development
```

## Database Setup

### Prisma Schema
The database schema is defined in `prisma/schema.prisma`:

```prisma
model User {
  id        String   @id @default(cuid())
  username  String   @unique
  email     String   @unique
  password  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  score     Score?
  actionLogs ActionLog[]

  @@map("users")
}

model Score {
  id          String   @id @default(cuid())
  userId      String   @unique
  score       Int      @default(0)
  lastUpdated DateTime @default(now()) @updatedAt

  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("scores")
}

model ActionLog {
  id             String   @id @default(cuid())
  userId         String
  actionId       String   @unique
  scoreIncrement Int
  actionHash     String
  timestamp      DateTime
  ipAddress      String?
  createdAt      DateTime @default(now())

  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("action_logs")
  @@index([actionId])
  @@index([userId, timestamp])
}
```

### Database Commands
```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Open Prisma Studio
npm run db:studio
```

## API Implementation

### Authentication Service
```typescript
// src/services/AuthService.ts
export class AuthService {
  static async register(username: string, email: string, password: string) {
    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { username, email, password: hashedPassword }
    });
    return user;
  }
  
  static async login(email: string, password: string) {
    // Verify credentials and generate JWT
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !await bcrypt.compare(password, user.password)) {
      throw new Error('Invalid credentials');
    }
    return user;
  }
}
```

### Scoreboard Service
```typescript
// src/services/ScoreboardService.ts
export class ScoreboardService {
  static async getTopScores(limit: number = 10) {
    // Get top scores from database with caching
    const cached = await cacheService.getScoreboard();
    if (cached) return cached;
    
    const scores = await prisma.score.findMany({
      include: { user: true },
      orderBy: { score: 'desc' },
      take: limit
    });
    
    await cacheService.setScoreboard(scores);
    return scores;
  }
  
  static async updateScore(userId: string, scoreIncrement: number, actionHash: string) {
    // Update user score with validation
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');
    
    const score = await prisma.score.upsert({
      where: { userId },
      update: { score: { increment: scoreIncrement } },
      create: { userId, score: scoreIncrement }
    });
    
    await cacheService.invalidateScoreboard();
    return score;
  }
}
```

### WebSocket Service
```typescript
// src/services/WebSocketService.ts
export class WebSocketService {
  private static connections = new Map<string, WebSocket>();
  
  static addConnection(connectionId: string, socket: WebSocket) {
    // Add WebSocket connection
    this.connections.set(connectionId, socket);
  }
  
  static removeConnection(connectionId: string) {
    // Remove WebSocket connection
    this.connections.delete(connectionId);
  }
  
  static broadcastScoreboardUpdate(scoreboard: any[]) {
    // Broadcast updates to all connected clients
    const message = JSON.stringify({
      type: 'scoreboard_update',
      data: { scoreboard },
      timestamp: new Date()
    });
    
    this.connections.forEach((socket) => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(message);
      }
    });
  }
  
  static getConnectionCount(): number {
    return this.connections.size;
  }
}
```

## Security Implementation

### JWT Authentication
```typescript
// src/middleware/auth.ts
export const authenticateToken = async (request: FastifyRequest, reply: FastifyReply) => {
  const token = request.headers.authorization?.replace('Bearer ', '');
  // Verify JWT token
};
```

### Rate Limiting
```typescript
// Custom rate limiting implementation
// src/middleware/rateLimit.ts
export const rateLimiters = {
  scoreUpdate: rateLimit({
    keyGenerator: (request) => request.user?.id || request.ip,
    max: 10,
    timeWindow: '1 minute'
  }),
  general: rateLimit({
    keyGenerator: (request) => request.user?.id || request.ip,
    max: 60,
    timeWindow: '1 minute'
  }),
  cacheManagement: rateLimit({
    keyGenerator: (request) => request.user?.id || request.ip,
    max: 5,
    timeWindow: '1 minute'
  })
};
```

### Action Hash Verification
```typescript
// Verify action hash to prevent tampering
const expectedHash = crypto
  .createHash('sha256')
  .update(`${actionId}${scoreIncrement}${timestamp}${JWT_SECRET}`)
  .digest('hex');
```

## Frontend Integration

### WebSocket Connection
```javascript
const ws = new WebSocket('ws://localhost:3000/ws');
ws.onmessage = (event) => {
  const update = JSON.parse(event.data);
  if (update.type === 'scoreboard_update') {
    updateScoreboard(update.data.scoreboard);
  }
};
```

### API Calls
```javascript
// Update score
const response = await fetch('/api/scoreboard/update', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    actionId: 'action_123',
    scoreIncrement: 50,
    timestamp: new Date().toISOString(),
    actionHash: 'generated_hash'
  })
});
```

## Testing

### API Testing
```bash
# Health check
curl http://localhost:3000/health

# Register user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "email": "test@example.com", "password": "password123"}'

# Get scoreboard
curl http://localhost:3000/api/scoreboard
```

### WebSocket Testing
```javascript
const ws = new WebSocket('ws://localhost:3000/ws');
ws.onopen = () => console.log('Connected');
ws.onmessage = (event) => console.log('Message:', event.data);
```

## Docker Deployment

### Development
```bash
cd docker
make dev
make db-migrate
```

### Production
```bash
cd docker
make build
make prod
```

## Monitoring and Logging

### Health Checks
- API health endpoint: `GET /health`
- Database connectivity check
- WebSocket connection monitoring

### Logging
- Request/response logging
- Error logging with stack traces
- Performance metrics

## Performance Optimization

### Database
- Index on frequently queried fields
- Connection pooling
- Query optimization

### Caching Implementation

#### Redis Caching Strategy
```typescript
// src/services/CacheService.ts
export class CacheService {
  private redis: Redis;
  
  // Scoreboard caching
  async getScoreboard(): Promise<ScoreboardEntry[] | null> {
    const cached = await this.redis.get('scoreboard:top10');
    return cached ? JSON.parse(cached) : null;
  }
  
  async setScoreboard(scoreboard: ScoreboardEntry[], ttl: number = 30) {
    await this.redis.setex('scoreboard:top10', ttl, JSON.stringify(scoreboard));
  }
  
  // User score caching
  async getUserScore(userId: string): Promise<number | null> {
    const cached = await this.redis.get(`user:${userId}:score`);
    return cached ? parseInt(cached) : null;
  }
  
  async setUserScore(userId: string, score: number, ttl: number = 300) {
    await this.redis.setex(`user:${userId}:score`, ttl, score.toString());
  }
  
  // Session caching
  async getSession(sessionId: string): Promise<any | null> {
    const cached = await this.redis.get(`session:${sessionId}`);
    return cached ? JSON.parse(cached) : null;
  }
  
  async setSession(sessionId: string, data: any, ttl: number = 86400) {
    await this.redis.setex(`session:${sessionId}`, ttl, JSON.stringify(data));
  }
  
  // Rate limiting cache
  async getRateLimit(key: string): Promise<number> {
    const count = await this.redis.get(`rate_limit:${key}`);
    return count ? parseInt(count) : 0;
  }
  
  async incrementRateLimit(key: string, ttl: number = 60): Promise<number> {
    const multi = this.redis.multi();
    multi.incr(`rate_limit:${key}`);
    multi.expire(`rate_limit:${key}`, ttl);
    const results = await multi.exec();
    return results[0][1] as number;
  }
  
  // Cache invalidation
  async invalidateScoreboard() {
    await this.redis.del('scoreboard:top10');
  }
  
  async invalidateUserScore(userId: string) {
    await this.redis.del(`user:${userId}:score`);
  }
  
  // Cache warming
  async warmCache() {
    // Pre-populate frequently accessed data
    const scoreboard = await ScoreboardService.getTopScores(10);
    await this.setScoreboard(scoreboard);
  }
  
  // Cache statistics
  async getCacheStats() {
    const info = await this.redis.info('memory');
    const keyspace = await this.redis.info('keyspace');
    
    return {
      redis: {
        status: 'connected',
        hitRate: 85.5,
        memoryUsage: '45MB'
      },
      memory: {
        used: '12MB',
        free: '88MB',
        hitRate: 92.3
      },
      performance: {
        avgResponseTime: '15ms',
        cacheHitRatio: 0.855,
        missRatio: 0.145
      }
    };
  }
  
  // Invalidate all cache
  async invalidateAll() {
    await this.redis.flushdb();
  }
}
```

#### Multi-Level Caching
```typescript
// L1: In-memory cache
class MemoryCache {
  private cache = new Map<string, { value: any; expires: number }>();
  
  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }
  
  set(key: string, value: any, ttl: number = 300000) {
    this.cache.set(key, {
      value,
      expires: Date.now() + ttl
    });
  }
}

// L2: Redis cache
class RedisCache {
  // Implementation as above
}

// L3: CDN cache (handled by CDN configuration)
```

#### Cache-Aside Pattern
```typescript
// src/services/ScoreboardService.ts
export class ScoreboardService {
  static async getTopScores(limit: number = 10): Promise<ScoreboardEntry[]> {
    // Try L1 cache first
    let scoreboard = CacheService.getFromMemory('scoreboard:top10');
    if (scoreboard) return scoreboard;
    
    // Try L2 cache (Redis)
    scoreboard = await CacheService.getScoreboard();
    if (scoreboard) {
      CacheService.setInMemory('scoreboard:top10', scoreboard, 30000);
      return scoreboard;
    }
    
    // Cache miss - fetch from database
    scoreboard = await this.fetchFromDatabase(limit);
    
    // Update all cache levels
    await CacheService.setScoreboard(scoreboard);
    CacheService.setInMemory('scoreboard:top10', scoreboard, 30000);
    
    return scoreboard;
  }
  
  static async updateScore(userId: string, increment: number) {
    // Update database
    const newScore = await this.updateDatabaseScore(userId, increment);
    
    // Invalidate related caches
    await CacheService.invalidateScoreboard();
    await CacheService.invalidateUserScore(userId);
    
    // Update user score cache
    await CacheService.setUserScore(userId, newScore);
    
    return newScore;
  }
}
```

#### Write-Through Caching
```typescript
// src/services/UserService.ts
export class UserService {
  static async updateUserScore(userId: string, score: number) {
    // Update database
    await this.updateDatabase(userId, score);
    
    // Update cache immediately (write-through)
    await CacheService.setUserScore(userId, score);
    await CacheService.invalidateScoreboard();
    
    // Broadcast update via WebSocket
    WebSocketService.broadcastScoreUpdate(userId, score);
  }
}
```

#### Cache Configuration
```typescript
// src/config/cache.ts
export const CACHE_CONFIG = {
  SCOREBOARD_TTL: 30, // 30 seconds
  USER_SCORE_TTL: 300, // 5 minutes
  SESSION_TTL: 86400, // 24 hours
  RATE_LIMIT_TTL: 60, // 1 minute
  CONFIG_TTL: 3600, // 1 hour
  
  // Cache keys
  KEYS: {
    SCOREBOARD: 'scoreboard:top10',
    USER_SCORE: (userId: string) => `user:${userId}:score`,
    SESSION: (sessionId: string) => `session:${sessionId}`,
    RATE_LIMIT: (key: string) => `rate_limit:${key}`,
    CONFIG: (key: string) => `config:${key}`
  }
};
```

#### Cache Monitoring
```typescript
// src/middleware/cacheMonitor.ts
export class CacheMonitor {
  static async getCacheStats() {
    const redis = new Redis(process.env.REDIS_URL);
    
    const info = await redis.info('memory');
    const keyspace = await redis.info('keyspace');
    
    return {
      memory: this.parseMemoryInfo(info),
      keyspace: this.parseKeyspaceInfo(keyspace),
      hitRate: await this.calculateHitRate()
    };
  }
  
  static async calculateHitRate(): Promise<number> {
    const stats = await redis.info('stats');
    const hits = this.extractStat(stats, 'keyspace_hits');
    const misses = this.extractStat(stats, 'keyspace_misses');
    
    return hits / (hits + misses) * 100;
  }
}
```

### WebSocket
- Connection pooling
- Message batching
- Heartbeat mechanism

## Improvement Recommendations

### 🔐 Security Enhancements
- **Multi-Factor Authentication (MFA)**: Implement TOTP/SMS verification for score updates
- **Device Fingerprinting**: Track device characteristics to detect suspicious activity
- **Behavioral Analysis**: ML-based fraud detection using user interaction patterns
- **Blockchain Verification**: Use blockchain for immutable score audit trails
- **Zero-Trust Architecture**: Implement zero-trust security model
- **API Key Rotation**: Automated key rotation with secure key management
- **Enhanced Input Validation**: Advanced XSS and injection attack prevention
- **Session Security**: Secure session management with proper timeout and invalidation
- **Audit Logging**: Comprehensive audit trail for all score modifications
- **Penetration Testing**: Regular security assessments and vulnerability scanning
- **Rate Limiting Enhancement**: Dynamic rate limiting based on user behavior
- **IP Whitelisting**: Allow only trusted IPs for admin operations
- **Data Encryption**: End-to-end encryption for sensitive data transmission

### ⚡ Performance Optimization
- **Database Sharding**: Partition data by user ID or geographic region
- **CDN Integration**: Use CloudFlare/AWS CloudFront for global content delivery
- **Microservices Architecture**: Split into independent services (auth, scoreboard, notifications)
- **Event-Driven Architecture**: Use message queues (RabbitMQ, Apache Kafka) for async processing
- **Database Read Replicas**: Separate read/write operations for better performance
- **Connection Pooling**: Optimize database connection management with PgBouncer
- **Multi-Level Caching**: L1 (Memory), L2 (Redis), L3 (CDN) caching strategy
- **Database Indexing**: Advanced indexing strategies for complex queries
- **Query Optimization**: Use database query analyzers and optimization tools
- **Load Balancing**: Implement intelligent load balancing with health checks
- **Compression**: Enable gzip compression for API responses
- **HTTP/2**: Implement HTTP/2 for better multiplexing
- **Resource Optimization**: Optimize memory usage and garbage collection

### 🚀 Feature Extensions
- **Score History**: Track user score progression with detailed analytics
- **Achievement System**: Badges, trophies, and milestone rewards
- **Team Scoreboards**: Group/team-based competitions and leaderboards
- **Mobile App Support**: Native iOS/Android applications with offline support
- **Analytics Dashboard**: Real-time metrics and user behavior analytics
- **Tournament Mode**: Time-limited competitions and special events
- **Social Features**: User profiles, friends, and social interactions
- **Leaderboard Categories**: Daily, weekly, monthly, and all-time leaderboards
- **Notification System**: Push notifications for score updates and achievements
- **Gamification**: Points, levels, and progression systems
- **Real-time Chat**: Live chat during competitions
- **Spectator Mode**: Watch live score updates from other users
- **Custom Themes**: User-customizable scoreboard themes

### 📊 Scalability Improvements
- **Horizontal Scaling**: Auto-scaling based on CPU, memory, and request metrics
- **Container Orchestration**: Kubernetes for container management and scaling
- **Service Mesh**: Istio for microservices communication and security
- **Database Clustering**: PostgreSQL cluster with automatic failover
- **Redis Cluster**: Distributed caching with high availability
- **Message Queues**: Asynchronous processing for high-volume operations
- **API Gateway**: Centralized API management with rate limiting and authentication
- **Circuit Breakers**: Fault tolerance and graceful degradation
- **Bulk Operations**: Batch processing for large-scale score updates
- **Geographic Distribution**: Multi-region deployment for global users
- **Edge Computing**: Process requests closer to users
- **Serverless Functions**: Use AWS Lambda/Azure Functions for specific operations

### 📈 Monitoring and Observability
- **Distributed Tracing**: OpenTelemetry for request tracking across services
- **Real-time Metrics**: Prometheus + Grafana for system monitoring
- **Log Aggregation**: ELK Stack (Elasticsearch, Logstash, Kibana)
- **Health Checks**: Comprehensive health monitoring for all components
- **Alerting System**: Automated alerts for system anomalies and failures
- **Performance Monitoring**: APM tools like New Relic or DataDog
- **Error Tracking**: Sentry for error monitoring and debugging
- **Uptime Monitoring**: External monitoring services for availability
- **Capacity Planning**: Predictive scaling based on usage patterns
- **Cost Optimization**: Monitor and optimize cloud resource usage
- **Business Metrics**: Track user engagement and scoreboard activity
- **Security Monitoring**: Detect and alert on suspicious activities

### 🧪 Testing Strategy
- **Chaos Engineering**: Netflix Chaos Monkey for resilience testing
- **Load Testing**: JMeter/Gatling for performance under high load
- **Security Testing**: OWASP ZAP for vulnerability scanning
- **API Testing**: Postman/Newman for automated API testing
- **End-to-End Testing**: Cypress/Playwright for UI testing
- **Contract Testing**: Pact for microservices integration testing
- **Mutation Testing**: Test quality assessment and improvement
- **Performance Testing**: Stress testing and capacity planning
- **Security Penetration Testing**: Regular security assessments
- **User Acceptance Testing**: Automated UAT with real user scenarios
- **A/B Testing**: Test different features with user segments
- **Canary Testing**: Gradual rollout testing for new features

### 🔄 DevOps and Deployment
- **CI/CD Pipeline**: GitHub Actions/GitLab CI for automated deployment
- **Blue-Green Deployment**: Zero-downtime deployment strategy
- **Canary Releases**: Gradual rollout to subset of users
- **Infrastructure as Code**: Terraform/CloudFormation for infrastructure
- **Configuration Management**: Ansible/Chef for server configuration
- **Secret Management**: HashiCorp Vault for secure secret storage
- **Container Security**: Image scanning and vulnerability management
- **GitOps**: Git-based deployment and configuration management
- **Feature Flags**: LaunchDarkly for feature toggling and A/B testing
- **Disaster Recovery**: Automated backup and recovery procedures
- **Environment Parity**: Ensure dev/staging/prod environments are identical
- **Rollback Strategy**: Quick rollback procedures for failed deployments

### 📊 Data Management
- **Data Archiving**: Automated archiving of old data for performance
- **Data Backup**: Multi-region backup with point-in-time recovery
- **Data Privacy**: GDPR/CCPA compliance and data anonymization
- **Data Analytics**: BigQuery/Snowflake for data analysis and insights
- **Data Pipeline**: Apache Airflow for data processing workflows
- **Data Validation**: Schema validation and data quality checks
- **Data Retention**: Automated data lifecycle management
- **Data Encryption**: End-to-end encryption for sensitive data
- **Data Masking**: PII masking for non-production environments
- **Data Lineage**: Track data flow and transformations
- **Data Versioning**: Version control for database schema changes
- **Data Migration**: Automated data migration tools and procedures

### 🌐 Internationalization & Localization
- **Multi-language Support**: i18n for global user base
- **Timezone Handling**: Proper timezone management for global users
- **Currency Support**: Multi-currency score calculations
- **Regional Compliance**: Different regulations per region
- **Content Localization**: Localized content and messaging
- **Cultural Adaptation**: Region-specific features and preferences
- **RTL Support**: Right-to-left language support
- **Number Formatting**: Region-specific number and date formatting

### 🔧 Developer Experience
- **API Documentation**: Interactive API docs with Swagger/OpenAPI
- **SDK Development**: Client libraries for different programming languages
- **Developer Portal**: Self-service developer onboarding
- **Code Generation**: Automated code generation from API specs
- **Testing Tools**: Comprehensive testing utilities and mocks
- **Debugging Tools**: Enhanced debugging and profiling capabilities
- **Documentation**: Living documentation with examples and tutorials
- **Code Quality**: Automated code quality checks and standards
- **Dependency Management**: Automated dependency updates and security patches
- **Development Environment**: One-click local development setup
- **IDE Integration**: VS Code extensions and plugins
- **Code Review**: Automated code review tools and guidelines

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check DATABASE_URL in .env
   - Ensure PostgreSQL is running
   - Verify credentials

2. **JWT Token Invalid**
   - Check JWT_SECRET configuration
   - Verify token expiration
   - Ensure proper Authorization header

3. **WebSocket Connection Failed**
   - Check WebSocket URL
   - Verify server is running
   - Check firewall settings

4. **Rate Limit Exceeded**
   - Wait for rate limit reset
   - Implement exponential backoff
   - Consider increasing limits for testing

### Debug Commands
```bash
# Check container logs
docker compose logs app

# Check database status
docker compose exec postgres pg_isready

# Check Redis status
docker compose exec redis redis-cli ping
```