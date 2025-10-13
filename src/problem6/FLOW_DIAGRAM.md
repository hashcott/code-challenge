# Scoreboard System Flow Diagram

## System Architecture Overview

```mermaid
graph TB
    subgraph "Client Side"
        A[User Action] --> B[Action Completion]
        B --> C[Generate Action Hash]
        C --> D[API Call to Update Score]
    end
    
    subgraph "API Gateway"
        E[Load Balancer] --> F[Rate Limiter]
        F --> G[Authentication Middleware]
    end
    
    subgraph "Backend Services"
        H[Score Update API] --> I[Validation Service]
        I --> J[Security Check]
        J --> K[Database Transaction]
        K --> L[Cache Update]
        L --> M[Real-time Notification]
    end
    
    subgraph "Data Layer"
        N[(PostgreSQL)]
        O[(Redis Cache)]
        P[WebSocket Server]
    end
    
    subgraph "Monitoring"
        Q[Logging Service]
        R[Metrics Collection]
        S[Alert System]
    end
    
    D --> E
    G --> H
    K --> N
    L --> O
    M --> P
    H --> Q
    Q --> R
    R --> S
```

## Score Update Flow

```mermaid
sequenceDiagram
    participant U as User
    participant C as Client
    participant API as API Gateway
    participant AUTH as Auth Service
    participant SCORE as Score Service
    participant DB as Database
    participant CACHE as Redis
    participant WS as WebSocket
    participant OTHER as Other Users
    
    U->>C: Complete Action
    C->>C: Generate Action Hash
    C->>API: POST /api/scoreboard/update
    API->>AUTH: Validate JWT Token
    AUTH-->>API: Token Valid
    API->>SCORE: Process Score Update
    
    SCORE->>SCORE: Validate Action ID
    SCORE->>SCORE: Check Rate Limit
    SCORE->>SCORE: Verify Action Hash
    SCORE->>DB: Begin Transaction
    DB->>DB: Update User Score
    DB->>DB: Log Action
    DB-->>SCORE: Transaction Complete
    
    SCORE->>CACHE: Update Top 10 Cache
    SCORE->>WS: Broadcast Score Update
    WS->>OTHER: Real-time Update
    SCORE-->>API: Success Response
    API-->>C: Score Updated
```

## Security Validation Flow

```mermaid
flowchart TD
    A[Receive Score Update Request] --> B{Valid JWT Token?}
    B -->|No| C[Return 401 Unauthorized]
    B -->|Yes| D{User Can Update Own Score?}
    D -->|No| E[Return 403 Forbidden]
    D -->|Yes| F{Action ID Unique?}
    F -->|No| G[Return 409 Conflict]
    F -->|Yes| H{Rate Limit OK?}
    H -->|No| I[Return 429 Too Many Requests]
    H -->|Yes| J{Valid Action Hash?}
    J -->|No| K[Return 400 Bad Request]
    J -->|Yes| L{Score Increment Reasonable?}
    L -->|No| M[Return 400 Bad Request]
    L -->|Yes| N[Process Score Update]
    N --> O[Update Database]
    O --> P[Update Cache]
    P --> Q[Send Real-time Update]
    Q --> R[Return Success]
```

## Real-time Update Flow

```mermaid
graph LR
    subgraph "Score Update Process"
        A[Score Updated] --> B[Database Transaction]
        B --> C[Cache Invalidation]
        C --> D[Generate Update Event]
    end
    
    subgraph "Real-time Distribution"
        D --> E[WebSocket Manager]
        E --> F[Message Queue]
        F --> G[Broadcast to Connected Clients]
    end
    
    subgraph "Client Updates"
        G --> H[Client 1]
        G --> I[Client 2]
        G --> J[Client N]
        H --> K[Update UI]
        I --> L[Update UI]
        J --> M[Update UI]
    end
```

## Error Handling Flow

```mermaid
flowchart TD
    A[API Request] --> B{Authentication Valid?}
    B -->|No| C[Log Security Event]
    C --> D[Return 401]
    
    B -->|Yes| E{Rate Limit OK?}
    E -->|No| F[Log Rate Limit Exceeded]
    F --> G[Return 429]
    
    E -->|Yes| H{Action ID Valid?}
    H -->|No| I[Log Duplicate Action]
    I --> J[Return 409]
    
    H -->|Yes| K{Database Available?}
    K -->|No| L[Log Database Error]
    L --> M[Return 500]
    
    K -->|Yes| N[Process Update]
    N --> O{Update Successful?}
    O -->|No| P[Log Update Error]
    P --> Q[Return 500]
    
    O -->|Yes| R[Log Success]
    R --> S[Return 200]
```

## Performance Monitoring Flow

```mermaid
graph TB
    subgraph "Request Processing"
        A[Incoming Request] --> B[Start Timer]
        B --> C[Process Request]
        C --> D[End Timer]
    end
    
    subgraph "Metrics Collection"
        D --> E[Record Response Time]
        E --> F[Update Success/Error Count]
        F --> G[Check Performance Thresholds]
    end
    
    subgraph "Alerting"
        G --> H{Threshold Exceeded?}
        H -->|Yes| I[Send Alert]
        H -->|No| J[Continue Monitoring]
        I --> K[Log Alert]
    end
    
    subgraph "Dashboard"
        E --> L[Update Metrics Dashboard]
        F --> L
        G --> L
    end
```

## Database Optimization Flow

```mermaid
graph TD
    subgraph "Query Optimization"
        A[Scoreboard Query] --> B{Use Cache?}
        B -->|Yes| C[Check Redis Cache]
        C --> D{Cache Hit?}
        D -->|Yes| E[Return Cached Data]
        D -->|No| F[Query Database]
        B -->|No| F
    end
    
    subgraph "Database Operations"
        F --> G[Use Index on Score DESC]
        G --> H[Limit to Top 10]
        H --> I[Return Results]
        I --> J[Update Cache]
    end
    
    subgraph "Cache Management"
        J --> K[Set TTL: 30 seconds]
        K --> L[Monitor Cache Hit Rate]
        L --> M{Low Hit Rate?}
        M -->|Yes| N[Adjust TTL]
        M -->|No| O[Maintain Current TTL]
    end
```

## Deployment Flow

```mermaid
graph LR
    subgraph "Development"
        A[Code Changes] --> B[Unit Tests]
        B --> C[Integration Tests]
        C --> D[Build Application]
    end
    
    subgraph "Staging"
        D --> E[Deploy to Staging]
        E --> F[Load Testing]
        F --> G[Security Testing]
        G --> H{All Tests Pass?}
        H -->|No| I[Fix Issues]
        I --> B
        H -->|Yes| J[Deploy to Production]
    end
    
    subgraph "Production"
        J --> K[Health Checks]
        K --> L[Monitor Metrics]
        L --> M[Rollback if Needed]
    end
```

## Key Components Interaction

```mermaid
graph TB
    subgraph "Frontend"
        A[User Interface]
        B[WebSocket Client]
        C[API Client]
    end
    
    subgraph "Backend Services"
        D[API Gateway]
        E[Authentication Service]
        F[Score Service]
        G[WebSocket Service]
        H[Cache Service]
    end
    
    subgraph "Data Storage"
        I[(PostgreSQL)]
        J[(Redis)]
        K[File System Logs]
    end
    
    subgraph "External Services"
        L[Monitoring Service]
        M[Alert Service]
        N[CDN]
    end
    
    A --> D
    B --> G
    C --> D
    D --> E
    D --> F
    F --> I
    F --> J
    G --> B
    H --> J
    F --> L
    L --> M
    D --> N
```

## Notes on Flow Diagrams

1. **Authentication Flow**: JWT tokens are validated at the API gateway level before any score processing
2. **Security Validation**: Multiple layers of validation prevent unauthorized score manipulation
3. **Real-time Updates**: WebSocket connections provide instant scoreboard updates to all connected clients
4. **Performance**: Caching and database optimization ensure fast response times
5. **Monitoring**: Comprehensive logging and metrics collection for system health
6. **Error Handling**: Graceful error handling with appropriate HTTP status codes
7. **Scalability**: Load balancing and horizontal scaling support for high user volumes
