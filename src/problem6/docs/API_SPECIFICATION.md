# API Specification

## Overview
Backend API module for a real-time scoreboard system with live updates and security measures.

## API Endpoints

### Authentication

#### Register User
```
POST /api/auth/register
```
**Request:**
```json
{
  "username": "player1",
  "email": "player1@example.com", 
  "password": "password123"
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": "user123",
      "username": "player1",
      "email": "player1@example.com"
    }
  }
}
```

#### Login User
```
POST /api/auth/login
```
**Request:**
```json
{
  "email": "player1@example.com",
  "password": "password123"
}
```

### Scoreboard

#### Get Scoreboard
```
GET /api/scoreboard
```
**Response:**
```json
{
  "success": true,
  "data": {
    "scoreboard": [
      {
        "rank": 1,
        "userId": "user123",
        "username": "player1",
        "score": 1500,
        "lastUpdated": "2024-01-15T10:30:00Z"
      }
    ],
    "totalUsers": 1250,
    "lastUpdated": "2024-01-15T10:30:00Z"
  }
}
```

#### Update Score
```
POST /api/scoreboard/update
```
**Headers:** `Authorization: Bearer <jwt_token>`
**Request:**
```json
{
  "actionId": "action_abc123",
  "scoreIncrement": 50,
  "timestamp": "2024-01-15T10:30:00Z",
  "actionHash": "sha256_hash_of_action_data"
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "user123",
    "newScore": 1550,
    "rank": 5,
    "message": "Score updated successfully"
  }
}
```

#### Get User Score
```
GET /api/scoreboard/user/{userId}
```

#### Generate Action Data
```
POST /api/scoreboard/generate-action
```
**Headers:** `Authorization: Bearer <jwt_token>`
**Request:**
```json
{
  "actionId": "action_abc123",
  "scoreIncrement": 50
}
```

### System

#### Health Check
```
GET /health
```
**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00Z",
  "websocketConnections": 5,
  "cache": {
    "redis": "connected",
    "hitRate": 85.5,
    "memoryUsage": "45MB"
  }
}
```

#### Cache Management
```
GET /api/cache/stats
```
**Description**: Get cache statistics and performance metrics

**Response:**
```json
{
  "success": true,
  "data": {
    "redis": {
      "status": "connected",
      "hitRate": 85.5,
      "memoryUsage": "45MB",
      "keyspace": {
        "scoreboard": 1,
        "user_scores": 1250,
        "sessions": 89,
        "rate_limits": 45
      }
    },
    "memory": {
      "used": "12MB",
      "free": "88MB",
      "hitRate": 92.3
    },
    "performance": {
      "avgResponseTime": "15ms",
      "cacheHitRatio": 0.855,
      "missRatio": 0.145
    }
  }
}
```

```
POST /api/cache/warm
```
**Description**: Warm up cache with frequently accessed data

**Headers:** `Authorization: Bearer <jwt_token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Cache warmed successfully",
    "itemsCached": 1250,
    "duration": "2.3s"
  }
}
```

```
DELETE /api/cache/clear
```
**Description**: Clear all cache data

**Headers:** `Authorization: Bearer <jwt_token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Cache cleared successfully",
    "keysDeleted": 1385
  }
}
```

#### WebSocket
```
GET /ws
```
**Connection:** `ws://localhost:3000/ws`

## Database Schema

### User Table
```sql
CREATE TABLE User (
  id        String   @id @default(cuid())
  username  String   @unique
  email     String   @unique
  password  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  scores    Score[]
  actionLogs ActionLog[]
)
```

### Score Table
```sql
CREATE TABLE Score (
  id          String   @id @default(cuid())
  userId      String
  score       Int      @default(0)
  lastUpdated DateTime @default(now())
  user        User     @relation(fields: [userId], references: [id])
  actionLogs  ActionLog[]
)
```

### ActionLog Table
```sql
CREATE TABLE ActionLog (
  id           String   @id @default(cuid())
  userId       String
  actionId     String
  scoreIncrement Int
  timestamp    DateTime
  actionHash   String
  ipAddress    String
  createdAt    DateTime @default(now())
  user         User     @relation(fields: [userId], references: [id])
  score        Score    @relation(fields: [scoreId], references: [id])
)
```

## Security Implementation

### Authentication
- JWT tokens with 24-hour expiration
- Password hashing using bcrypt
- Token validation on protected endpoints

### Rate Limiting
- 10 requests per minute per user for score updates
- IP-based rate limiting for public endpoints

### Action Validation
- SHA-256 hash verification for action data
- Timestamp validation (5-minute window)
- Duplicate action prevention

### Input Validation
- Required field validation
- Data type validation
- SQL injection prevention via Prisma ORM

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": {
    "code": "MISSING_FIELDS",
    "message": "All fields are required"
  }
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": {
    "code": "INVALID_TOKEN",
    "message": "Invalid or expired token"
  }
}
```

### 429 Too Many Requests
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests"
  }
}
```

## WebSocket Events

### Scoreboard Update
```json
{
  "type": "scoreboard_update",
  "data": {
    "scoreboard": [...],
    "lastUpdated": "2024-01-15T10:30:00Z"
  }
}
```

### Connection Status
```json
{
  "type": "connection_status",
  "data": {
    "status": "connected",
    "userId": "user123"
  }
}
```

## Performance Considerations

- Database indexing on frequently queried fields
- Redis caching for scoreboard data
- Connection pooling for database connections
- WebSocket connection management
- Rate limiting to prevent abuse

## Implementation Notes

- Use Prisma ORM for database operations
- Implement proper error handling and logging
- Add monitoring and health checks
- Consider horizontal scaling for high load
- Implement proper backup and recovery procedures

## Future Enhancements

### API Improvements
- **GraphQL Support**: Add GraphQL endpoint for flexible data querying
- **API Versioning**: Implement proper API versioning strategy
- **Rate Limiting Tiers**: Different rate limits for different user types
- **Bulk Operations**: Support for bulk score updates
- **Webhook Support**: Real-time webhooks for external integrations
- **API Analytics**: Track API usage and performance metrics
- **SDK Generation**: Auto-generate client SDKs from OpenAPI spec
- **API Documentation**: Interactive API documentation with examples

### Security Enhancements
- **OAuth 2.0**: Support for OAuth 2.0 authentication flows
- **API Keys**: Support for API key authentication
- **Request Signing**: HMAC request signing for additional security
- **IP Allowlisting**: IP-based access control
- **Request Validation**: Enhanced request validation and sanitization
- **Security Headers**: Implement security headers (CORS, CSP, etc.)
- **Audit Logging**: Comprehensive audit logging for all API calls
- **Threat Detection**: Real-time threat detection and blocking

### Performance Optimizations
- **Response Caching**: Implement intelligent response caching
- **Compression**: Enable response compression (gzip, brotli)
- **Pagination**: Implement cursor-based pagination for large datasets
- **Field Selection**: Allow clients to specify which fields to return
- **Response Streaming**: Stream large responses for better performance
- **Connection Pooling**: Optimize database connection management
- **Query Optimization**: Implement query optimization strategies
- **CDN Integration**: Use CDN for static API responses

### Monitoring and Observability
- **Metrics Collection**: Collect detailed API metrics
- **Distributed Tracing**: Implement distributed tracing
- **Error Tracking**: Comprehensive error tracking and alerting
- **Performance Monitoring**: Monitor API response times and throughput
- **Usage Analytics**: Track API usage patterns and trends
- **Health Checks**: Implement comprehensive health check endpoints
- **Alerting**: Set up automated alerting for API issues
- **Dashboard**: Create monitoring dashboards for API metrics

### Developer Experience
- **Interactive Docs**: Create interactive API documentation
- **Code Examples**: Provide code examples in multiple languages
- **Testing Tools**: Provide testing tools and utilities
- **Mock Server**: Create mock server for development
- **Postman Collection**: Provide Postman collection for testing
- **OpenAPI Spec**: Maintain comprehensive OpenAPI specification
- **Changelog**: Maintain API changelog and migration guides
- **Support**: Provide developer support and documentation