# Express TypeScript CRUD API

A comprehensive backend server built with ExpressJS 5.x, TypeScript 5.x, and SQLite database. This API provides full CRUD functionality for user management with OpenAPI Swagger documentation.

## 🌐 Live Demo

**🚀 [Live Demo on Render](https://code-challenge-goup.onrender.com)**

### Quick Test Endpoints:
- **Health Check**: [https://code-challenge-goup.onrender.com/health](https://code-challenge-goup.onrender.com/health)
- **API Info**: [https://code-challenge-goup.onrender.com/](https://code-challenge-goup.onrender.com/)
- **Users API**: [https://code-challenge-goup.onrender.com/api/users](https://code-challenge-goup.onrender.com/api/users)
- **API Documentation**: [https://code-challenge-goup.onrender.com/api-docs](https://code-challenge-goup.onrender.com/api-docs)

## 🚀 Technologies Used

- **Express 5.x** - Modern web framework
- **TypeScript 5.x** - Type-safe JavaScript
- **SQLite3** - Lightweight database
- **Node.js** - Runtime environment
- **Swagger/OpenAPI** - API documentation

## 📋 Features

### CRUD Operations for Users:
1. **Create** - Create new user
2. **Read** - Get users list with filters
3. **Get by ID** - Get user by unique identifier
4. **Update** - Update user information
5. **Delete** - Delete user

### API Endpoints:

#### Health Check
- `GET /health` - Server status check
- `GET /` - API information

#### Users API
- `POST /api/users` - Create new user
- `GET /api/users` - Get users list (with filters)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

#### Admin API
- `GET /api/admin/database/stats` - Get database statistics
- `GET /api/admin/database/indexes` - Get database indexes information
- `POST /api/admin/database/analyze` - Analyze query performance
- `POST /api/admin/database/optimize` - Optimize database

#### Documentation
- `GET /api-docs` - Interactive API documentation (Swagger UI)
- `GET /api-docs.json` - OpenAPI specification

## 🛠️ Installation and Setup

### System Requirements
- Node.js >= 18.0.0
- npm or yarn

### 1. Install Dependencies
```bash
npm install
```

### 2. Build TypeScript
```bash
npm run build
```

### 3. Run Application

#### Development mode (with hot reload):
```bash
npm run dev
```

#### Production mode:
```bash
npm start
```

#### Watch mode:
```bash
npm run watch
```

### 4. Run Tests

#### Run all tests:
```bash
npm test
```

#### Run tests in watch mode:
```bash
npm run test:watch
```

#### Run tests with coverage:
```bash
npm run test:coverage
```

#### Run benchmark tests:
```bash
npm run test:benchmark
```

## 📊 Database

SQLite database will be created automatically at `./database.sqlite` on first run.

### Users Schema:
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  age INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 🔧 API Usage Examples

### 🌐 Live Demo Testing

Test the live API at [https://code-challenge-goup.onrender.com](https://code-challenge-goup.onrender.com):

### 1. Create New User
```bash
curl -X POST https://code-challenge-goup.onrender.com/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "age": 30
  }'
```

### 2. Get Users List
```bash
# Get all users
curl https://code-challenge-goup.onrender.com/api/users

# Filter by name
curl "https://code-challenge-goup.onrender.com/api/users?name=John"

# Filter by email
curl "https://code-challenge-goup.onrender.com/api/users?email=john"

# Filter by age
curl "https://code-challenge-goup.onrender.com/api/users?age=30"

# Pagination
curl "https://code-challenge-goup.onrender.com/api/users?limit=10&offset=0"
```

### 3. Get User by ID
```bash
curl https://code-challenge-goup.onrender.com/api/users/1
```

### 4. Update User
```bash
curl -X PUT https://code-challenge-goup.onrender.com/api/users/1 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Smith",
    "age": 31
  }'
```

### 5. Delete User
```bash
curl -X DELETE https://code-challenge-goup.onrender.com/api/users/1
```

### 🏠 Local Development

For local development, replace the base URL with `http://localhost:3000`:

### 6. Database Performance Monitoring
```bash
# Get database statistics
curl http://localhost:3000/api/admin/database/stats

# Get indexes information
curl http://localhost:3000/api/admin/database/indexes

# Analyze query performance
curl -X POST http://localhost:3000/api/admin/database/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "query": "SELECT * FROM users WHERE name LIKE ? ORDER BY created_at DESC LIMIT 10",
    "params": ["%John%"]
  }'

# Optimize database
curl -X POST http://localhost:3000/api/admin/database/optimize
```

## 📁 Project Structure

```
src/
├── config/          # Configuration files (Swagger)
├── controllers/     # Request/response handlers
├── database/        # Database connection and setup
├── models/          # TypeScript interfaces
├── routes/          # API route definitions
├── services/        # Business logic layer
├── utils/           # Utility functions (Database performance)
└── main.ts          # Application entry point

tests/
├── benchmark/       # Performance benchmark tests
├── config/          # Test configuration
├── controllers/     # Unit tests for controllers
├── routes/          # Integration tests for routes
├── utils/           # Test helper utilities
└── setup.ts         # Test setup and configuration
```

## 🔒 Security Features

- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Input validation** - Request data validation
- **Error handling** - Secure error responses

## 🌐 Server Information

### 🚀 Live Production (Render)
- **Base URL**: https://code-challenge-goup.onrender.com
- **Health Check**: https://code-challenge-goup.onrender.com/health
- **API Base**: https://code-challenge-goup.onrender.com/api/users
- **Admin API**: https://code-challenge-goup.onrender.com/api/admin
- **API Documentation**: https://code-challenge-goup.onrender.com/api-docs

### 🏠 Local Development
- **Port**: 3000 (configurable via PORT environment variable)
- **Health Check**: http://localhost:3000/health
- **API Base**: http://localhost:3000/api/users
- **Admin API**: http://localhost:3000/api/admin
- **API Documentation**: http://localhost:3000/api-docs

## 📝 Response Format

All API responses follow a consistent format:

### Success Response:
```json
{
  "success": true,
  "data": {...},
  "message": "Success message",
  "count": 1
}
```

### Error Response:
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error information"
}
```

## 📚 API Documentation

The API includes comprehensive OpenAPI 3.0 documentation with Swagger UI:

- **Interactive Documentation**: http://localhost:3000/api-docs
- **OpenAPI Specification**: http://localhost:3000/api-docs.json

The documentation includes:
- Complete endpoint descriptions
- Request/response schemas
- Example requests and responses
- Error code explanations
- Interactive testing interface

## 🧪 Testing the API

### 🌐 Live Demo Testing
1. **Interactive Documentation**: [https://code-challenge-goup.onrender.com/api-docs](https://code-challenge-goup.onrender.com/api-docs)
2. **Health Check**: [https://code-challenge-goup.onrender.com/health](https://code-challenge-goup.onrender.com/health)
3. **Quick Test**: [https://code-challenge-goup.onrender.com/api/users](https://code-challenge-goup.onrender.com/api/users)
4. Use curl commands as shown in the examples above

### 🏠 Local Development Testing
1. Start the server: `npm run dev`
2. Open browser: http://localhost:3000/api-docs
3. Use the interactive Swagger UI to test endpoints
4. Or use curl commands as shown in the examples above

### Automated Testing
The project includes comprehensive automated testing:

#### Unit Tests
- **Controller Tests**: Test all CRUD operations
- **Admin Controller Tests**: Test database monitoring endpoints
- **Integration Tests**: Test complete API workflows

#### Performance Tests
- **Benchmark Tests**: Measure API response times and throughput
- **Load Tests**: Test performance under concurrent load
- **Database Performance**: Test query optimization with indexes

#### Test Coverage
- **Unit Test Coverage**: Tests for all controllers and services
- **Integration Coverage**: End-to-end API testing
- **Performance Coverage**: Benchmark and load testing

#### Running Tests
```bash
# Run all tests
npm test

# Run with coverage report
npm run test:coverage

# Run performance benchmarks
npm run test:benchmark

# Run tests in watch mode
npm run test:watch
```

## 🚀 Database Performance Optimization

### Indexes Added for Performance
The application includes comprehensive database indexes to optimize query performance:

#### Single Column Indexes
- **`idx_users_email`** - Optimizes email lookups and uniqueness checks
- **`idx_users_name`** - Optimizes name searches (LIKE queries)
- **`idx_users_age`** - Optimizes age filtering
- **`idx_users_created_at`** - Optimizes ordering by creation date (DESC)
- **`idx_users_updated_at`** - Optimizes audit queries by update date

#### Composite Indexes
- **`idx_users_name_email`** - Optimizes combined name and email filtering
- **`idx_users_age_created_at`** - Optimizes age filtering with date sorting

### Performance Monitoring
The application includes built-in performance monitoring tools:

#### Database Statistics
```bash
curl http://localhost:3000/api/admin/database/stats
```
Returns:
- Total number of users
- Users with age information
- Oldest and newest user creation dates
- Average age statistics

#### Index Information
```bash
curl http://localhost:3000/api/admin/database/indexes
```
Returns detailed information about all database indexes.

#### Query Analysis
```bash
curl -X POST http://localhost:3000/api/admin/database/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "query": "SELECT * FROM users WHERE name LIKE ? ORDER BY created_at DESC LIMIT 10",
    "params": ["%John%"]
  }'
```
Analyzes query execution plans for performance optimization.

#### Database Optimization
```bash
curl -X POST http://localhost:3000/api/admin/database/optimize
```
Runs VACUUM and ANALYZE to optimize database performance.

### Query Performance Benefits
With the added indexes, the following operations are significantly optimized:

1. **User Lookups by ID** - Primary key index (automatic)
2. **Email Searches** - Unique index on email field
3. **Name Searches** - Index on name field for LIKE queries
4. **Age Filtering** - Index on age field for exact matches
5. **Date Sorting** - Index on created_at for ORDER BY operations
6. **Combined Filters** - Composite indexes for multi-column queries

## 🔧 Development

### Code Quality
- TypeScript for type safety
- Comprehensive error handling
- Input validation
- Consistent response format
- Detailed logging
- Database performance monitoring

### Architecture
- MVC pattern
- Service layer for business logic
- Repository pattern for data access
- Dependency injection
- Separation of concerns
- Performance optimization utilities