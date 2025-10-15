# Flow Diagrams

## System Architecture

```mermaid
graph TB
    subgraph "Client Side"
        A[User Action] --> B[Action Completion]
        B --> C[Generate Action Hash]
        C --> D[API Call to Update Score]
    end
    
    subgraph "Fastify Server"
        E[CORS Middleware] --> F[JWT Authentication]
        F --> G[Rate Limiting]
        G --> H[Request Validation]
    end
    
    subgraph "Controllers & Services"
        I[AuthController] --> J[ScoreboardController]
        J --> K[CacheService]
        K --> L[WebSocketService]
    end
    
    subgraph "Data Layer"
        M[(PostgreSQL<br/>Prisma ORM)]
        N[(Redis Cache<br/>Multi-level)]
        O[WebSocket Connections]
    end
    
    D --> E
    H --> I
    L --> M
    K --> N
    L --> O
```

## Current Architecture Overview

> **✅ Current Implementation**: The system currently uses **monolithic architecture** with Fastify framework, not microservices.

### 🏗️ Current Tech Stack
- **Backend**: Fastify + TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis with multi-level caching (Memory + Redis)
- **Real-time**: WebSocket with custom WebSocketService
- **Authentication**: JWT tokens
- **Rate Limiting**: Custom cache-based rate limiting
- **Documentation**: Swagger/OpenAPI

### 🚫 Not Currently Implemented
- ❌ Microservices architecture
- ❌ Email service
- ❌ Analytics service  
- ❌ Push notifications
- ❌ Advanced monitoring (Prometheus/Grafana)
- ❌ Multi-Factor Authentication (MFA)
- ❌ Fraud detection system

## Future Architecture Improvements

> **📝 Note**: The architectures below are future development plans, not current implementation.

### 🚀 Phase 2: Microservices Architecture
```mermaid
graph TB
    subgraph "API Gateway"
        A[Load Balancer] --> B[Rate Limiter]
        B --> C[Authentication]
        C --> D[Routing]
    end
    
    subgraph "Core Services (Future)"
        E[User Service<br/>🔮 Future]
        F[Scoreboard Service<br/>🔮 Future]
        G[Notification Service<br/>🔮 Future]
        H[Analytics Service<br/>🔮 Future]
    end
    
    subgraph "Data Layer (Future)"
        I[(User DB<br/>🔮 Future)]
        J[(Score DB<br/>🔮 Future)]
        K[(Analytics DB<br/>🔮 Future)]
        L[(Cache<br/>🔮 Future)]
    end
    
    subgraph "External Services (Future)"
        M[Email Service<br/>🔮 Future]
        N[Push Notifications<br/>🔮 Future]
        O[Monitoring<br/>🔮 Future]
    end
    
    D --> E
    D --> F
    D --> G
    D --> H
    E --> I
    F --> J
    G --> M
    H --> K
    F --> L
    G --> N
    H --> O
```

### 🔮 Phase 3: Event-Driven Architecture (Future)
```mermaid
graph LR
    A[User Action] --> B[Event Bus<br/>🔮 Future]
    B --> C[Score Update Handler<br/>🔮 Future]
    B --> D[Notification Handler<br/>🔮 Future]
    B --> E[Analytics Handler<br/>🔮 Future]
    C --> F[Database]
    D --> G[Push Service<br/>🔮 Future]
    E --> H[Analytics DB<br/>🔮 Future]
```

### Multi-Level Caching Strategy
```mermaid
graph TB
    A[Client Request] --> B{Memory Cache<br/>L1 Cache}
    B -->|Hit| C[Return Cached Data]
    B -->|Miss| D{Redis Cache<br/>L2 Cache}
    D -->|Hit| E[Update Memory Cache]
    E --> F[Return Cached Data]
    D -->|Miss| G[Database Query<br/>Prisma ORM]
    G --> H[Update Redis Cache]
    H --> I[Update Memory Cache]
    I --> J[Return Data]
    
    K[Score Update] --> L[Invalidate Scoreboard Cache]
    L --> M[Invalidate User Score Cache]
    M --> N[Update Scoreboard Cache]
    N --> O[Broadcast WebSocket Update]
```

### Cache-Aside Pattern
```mermaid
sequenceDiagram
    participant C as Client
    participant A as Fastify App
    participant M as Memory Cache
    participant R as Redis Cache
    participant P as Prisma ORM
    participant D as PostgreSQL
    
    C->>A: GET /api/scoreboard
    A->>M: Check Memory Cache
    M-->>A: Cache Miss
    A->>R: Check Redis Cache
    R-->>A: Cache Miss
    A->>P: Query Database
    P->>D: SELECT with ORDER BY
    D-->>P: Return Scoreboard Data
    P-->>A: Return Data
    A->>R: Update Redis Cache (TTL: 30s)
    A->>M: Update Memory Cache (TTL: 30s)
    A-->>C: Return Scoreboard
```

### Write-Through Caching
```mermaid
sequenceDiagram
    participant C as Client
    participant A as Fastify App
    participant M as Memory Cache
    participant R as Redis Cache
    participant P as Prisma ORM
    participant D as PostgreSQL
    participant W as WebSocketService
    
    C->>A: POST /api/scoreboard/update
    A->>A: Validate JWT & Action Hash
    A->>P: Update Score in Database
    P->>D: UPDATE scores SET score = score + ?
    D-->>P: Success
    P-->>A: Return Updated Score
    A->>R: Update User Score Cache
    A->>M: Update Memory Cache
    A->>R: Invalidate Scoreboard Cache
    A->>W: Broadcast Scoreboard Update
    W->>W: Send to All Connected Clients
    A-->>C: Return Success Response
```

### Cache Warming Strategy
```mermaid
graph TB
    A[System Startup] --> B[Cache Warming Process]
    B --> C[Load Top 10 Scores]
    C --> D[Load Active User Sessions]
    D --> E[Load Configuration Data]
    E --> F[Pre-calculate Rate Limits]
    F --> G[Warm Memory Cache]
    G --> H[Warm Redis Cache]
    H --> I[System Ready]
    
    J[Scheduled Warming] --> K[Every 5 Minutes]
    K --> L[Update Hot Data]
    L --> M[Refresh Expired Cache]
    M --> N[Optimize Performance]
```

### Cache Invalidation Flow
```mermaid
graph TB
    A[Score Update] --> B[Identify Affected Caches]
    B --> C[Scoreboard Cache]
    B --> D[User Score Cache]
    B --> E[Related Queries Cache]
    
    C --> F[Invalidate Scoreboard]
    D --> G[Invalidate User Score]
    E --> H[Invalidate Related Caches]
    
    F --> I[Update Scoreboard Cache]
    G --> J[Update User Score Cache]
    H --> K[Refresh Related Caches]
    
    I --> L[Broadcast WebSocket Update]
    J --> L
    K --> L
```

### Cache Monitoring Flow
```mermaid
graph TB
    A[Cache Monitor] --> B[Collect Metrics]
    B --> C[Hit Rate Analysis]
    B --> D[Memory Usage Analysis]
    B --> E[Response Time Analysis]
    
    C --> F{Hit Rate < 80%?}
    F -->|Yes| G[Alert: Low Hit Rate]
    F -->|No| H[Continue Monitoring]
    
    D --> I{Memory > 90%?}
    I -->|Yes| J[Alert: High Memory Usage]
    I -->|No| H
    
    E --> K{Response Time > 100ms?}
    K -->|Yes| L[Alert: Slow Response]
    K -->|No| H
    
    G --> M[Auto-optimize Cache]
    J --> N[Clear Old Cache]
    L --> O[Scale Cache Resources]
```

## Performance Optimization Flows

### Database Optimization
```mermaid
sequenceDiagram
    participant C as Client
    participant L as Load Balancer
    participant A as App Server
    participant R as Read Replica
    participant W as Write DB
    participant Cache as Redis Cache
    
    C->>L: GET /api/scoreboard
    L->>A: Route Request
    A->>Cache: Check Cache
    Cache-->>A: Cache Miss
    A->>R: Query Read Replica
    R-->>A: Return Data
    A->>Cache: Update Cache
    A-->>L: Return Response
    L-->>C: Return Scoreboard
```

### WebSocket Optimization
```mermaid
graph TB
    A[WebSocket Connection] --> B[Connection Pool]
    B --> C[Message Queue]
    C --> D[Batch Processor]
    D --> E[Broadcast Manager]
    E --> F[Client 1]
    E --> G[Client 2]
    E --> H[Client N]
    
    I[Score Update] --> C
    J[Heartbeat] --> B
    K[Error Handler] --> B
```

## Security Enhancement Flows

### 🔮 Phase 4: Multi-Factor Authentication (Future)
```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as Auth Service
    participant M as MFA Service<br/>🔮 Future
    participant D as Database
    
    U->>F: Login Request
    F->>A: Authenticate
    A->>D: Verify Credentials
    D-->>A: User Found
    A->>M: Send MFA Code<br/>🔮 Future
    M-->>U: SMS/Email Code<br/>🔮 Future
    U->>F: Enter MFA Code
    F->>A: Verify MFA
    A->>M: Validate Code<br/>🔮 Future
    M-->>A: Code Valid<br/>🔮 Future
    A-->>F: Return JWT Token
```

### 🔮 Phase 5: Fraud Detection (Future)
```mermaid
graph TB
    A[User Action] --> B[Behavior Analysis<br/>🔮 Future]
    B --> C{Anomaly Detected?<br/>🔮 Future}
    C -->|Yes| D[Block Action<br/>🔮 Future]
    C -->|No| E[Allow Action]
    D --> F[Log Incident<br/>🔮 Future]
    E --> G[Process Action]
    F --> H[Alert Admin<br/>🔮 Future]
    G --> I[Update Score]
```

## Monitoring and Observability

### Health Check Flow (Current Implementation)
```mermaid
graph TB
    A[Health Check Request] --> B[Fastify Server Health]
    B --> C[PostgreSQL Health]
    C --> D[Redis Health]
    D --> E[WebSocket Health]
    E --> F[Return Health Status]
    
    G[Cache Stats] --> H[Redis Memory Usage]
    I[Connection Count] --> J[WebSocket Connections]
    K[Performance Metrics] --> L[Response Time]
```

> **Current Implementation**: The health check endpoint returns system status including cache statistics and WebSocket connection count.

### 🔮 Phase 6: Advanced Alerting Flow (Future)
```mermaid
sequenceDiagram
    participant M as Monitoring<br/>🔮 Future
    participant A as Alert Manager<br/>🔮 Future
    participant N as Notification Service<br/>🔮 Future
    participant D as Developer
    participant O as On-call Engineer<br/>🔮 Future
    
    M->>A: Metric Threshold Exceeded<br/>🔮 Future
    A->>N: Send Alert<br/>🔮 Future
    N->>D: Email/Slack Notification<br/>🔮 Future
    N->>O: PagerDuty Alert<br/>🔮 Future
    D->>M: Check Metrics<br/>🔮 Future
    O->>M: Investigate Issue<br/>🔮 Future
```

## Score Update Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as Fastify Server
    participant C as CacheService
    participant P as Prisma ORM
    participant D as PostgreSQL
    participant W as WebSocketService
    participant O as Other Clients
    
    U->>F: Complete Action
    F->>A: POST /api/scoreboard/generate-action
    A->>A: Generate Action Hash
    A-->>F: Return action data with hash
    F->>A: POST /api/scoreboard/update
    A->>A: Validate JWT token
    A->>A: Verify action hash
    A->>A: Check rate limits (10/min)
    A->>P: Update user score
    P->>D: UPDATE scores SET score = score + ?
    D-->>P: Confirm update
    P-->>A: Return updated score
    A->>C: Invalidate scoreboard cache
    A->>C: Update user score cache
    A->>W: Broadcast scoreboard update
    W->>O: Send real-time update
    A-->>F: Return success response
    F->>U: Show updated score
```

> **Current Implementation**: This flow shows the actual score update process with JWT authentication, action hash verification, and real-time WebSocket broadcasting.

## Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as Fastify Server
    participant AC as AuthController
    participant AS as AuthService
    participant P as Prisma ORM
    participant D as PostgreSQL
    
    U->>F: Enter credentials
    F->>A: POST /api/auth/login
    A->>AC: Route to AuthController
    AC->>AS: Login with email/password
    AS->>P: Find user by email
    P->>D: SELECT * FROM users WHERE email = ?
    D-->>P: Return user data
    P-->>AS: Return user
    AS->>AS: Verify password with bcrypt
    AS-->>AC: Return user data
    AC->>AC: Generate JWT token
    AC-->>A: Return token + user data
    A-->>F: Return success response
    F->>F: Store token locally
    F->>A: Use token for protected requests
```

> **Current Implementation**: Authentication uses JWT tokens with bcrypt password hashing and Prisma ORM for database operations.

## Security Validation Flow

```mermaid
flowchart TD
    A[Incoming Request] --> B{Has JWT Token?}
    B -->|No| C[Return 401 Unauthorized]
    B -->|Yes| D{Token Valid?}
    D -->|No| C
    D -->|Yes| E{Within Rate Limit?}
    E -->|No| F[Return 429 Too Many Requests]
    E -->|Yes| G{Action Hash Valid?}
    G -->|No| H[Return 400 Bad Request]
    G -->|Yes| I{Timestamp Valid?}
    I -->|No| H
    I -->|Yes| J[Process Request]
    J --> K[Update Database]
    K --> L[Broadcast Update]
```

## WebSocket Connection Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant A as Fastify Server
    participant W as WebSocketService
    participant M as Connection Map
    
    C->>A: WebSocket Connection Request
    A->>W: Create Connection
    W->>M: Store Connection (connectionId, socket)
    W->>C: Send Connection Status
    C->>A: Send Message
    A->>W: Process Message
    W->>W: Broadcast to All Connections
    W->>C: Send Real-time Updates
    C->>A: Close Connection
    A->>W: Remove Connection
    W->>M: Delete from Map
```

> **Current Implementation**: WebSocket connections are managed by a custom WebSocketService with connection tracking and real-time broadcasting capabilities.

## Real-time Update Flow

```mermaid
graph LR
    A[Score Update] --> B[Database Transaction]
    B --> C[Update Cache]
    C --> D[WebSocketService.broadcast]
    D --> E[Client 1]
    D --> F[Client 2]
    D --> G[Client N]
    E --> H[Update UI]
    F --> I[Update UI]
    G --> J[Update UI]
```

## Error Handling Flow

```mermaid
flowchart TD
    A[Request Received] --> B{Valid Request?}
    B -->|No| C[Return 400 Bad Request]
    B -->|Yes| D{Authenticated?}
    D -->|No| E[Return 401 Unauthorized]
    D -->|Yes| F{Within Rate Limit?}
    F -->|No| G[Return 429 Too Many Requests]
    F -->|Yes| H{Database Available?}
    H -->|No| I[Return 503 Service Unavailable]
    H -->|Yes| J[Process Request]
    J --> K{Success?}
    K -->|No| L[Return 500 Internal Error]
    K -->|Yes| M[Return Success Response]
```

## Database Operations Flow

```mermaid
sequenceDiagram
    participant A as Fastify Server
    participant SC as ScoreboardController
    participant P as Prisma ORM
    participant D as PostgreSQL
    participant C as CacheService
    participant W as WebSocketService
    
    A->>SC: Score Update Request
    SC->>P: Begin Transaction
    P->>D: BEGIN TRANSACTION
    D-->>P: Transaction Started
    P->>D: UPDATE scores SET score = score + ?
    D-->>P: Score Updated
    P->>D: INSERT INTO action_logs
    D-->>P: Action Logged
    P->>D: COMMIT TRANSACTION
    D-->>P: Transaction Committed
    P-->>SC: Return Updated Score
    SC->>C: Invalidate scoreboard cache
    SC->>C: Update user score cache
    C-->>SC: Cache Updated
    SC->>W: Broadcast scoreboard update
    W->>W: Send to all connected clients
    SC-->>A: Success Response
    A-->>A: Return to client
```

> **Current Implementation**: Database operations use Prisma ORM with transaction support, cache invalidation, and real-time WebSocket broadcasting.