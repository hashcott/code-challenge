import request from 'supertest';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import userRoutes from '../../src/routes/userRoutes';
import adminRoutes from '../../src/routes/adminRoutes';

/**
 * Integration Tests
 * Tests complete API endpoints with middleware
 */

describe('API Integration Tests', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    
    // Apply middleware
    app.use(helmet());
    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    
    // Apply routes
    app.use('/api/users', userRoutes);
    app.use('/api/admin', adminRoutes);
    
    // Error handling middleware
    app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: err.message
      });
    });
    
    // 404 handler
    app.use((req, res) => {
      res.status(404).json({
        success: false,
        message: 'Route not found'
      });
    });
  });

  describe('User API Integration', () => {
    it('should handle complete user lifecycle', async () => {
      // 1. Create user
      const createResponse = await request(app)
        .post('/api/users')
        .send({
          name: 'Integration Test User',
          email: 'integration@example.com',
          age: 28
        })
        .expect(201);

      const userId = createResponse.body.data.id;
      expect(createResponse.body.success).toBe(true);
      expect(createResponse.body.data.name).toBe('Integration Test User');

      // 2. Get user by ID
      const getResponse = await request(app)
        .get(`/api/users/${userId}`)
        .expect(200);

      expect(getResponse.body.success).toBe(true);
      expect(getResponse.body.data.id).toBe(userId);

      // 3. Update user
      const updateResponse = await request(app)
        .put(`/api/users/${userId}`)
        .send({
          name: 'Updated Integration Test User',
          age: 29
        })
        .expect(200);

      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.data.name).toBe('Updated Integration Test User');
      expect(updateResponse.body.data.age).toBe(29);

      // 4. Get all users
      const getAllResponse = await request(app)
        .get('/api/users')
        .expect(200);

      expect(getAllResponse.body.success).toBe(true);
      expect(getAllResponse.body.data.length).toBeGreaterThan(0);

      // 5. Delete user
      const deleteResponse = await request(app)
        .delete(`/api/users/${userId}`)
        .expect(200);

      expect(deleteResponse.body.success).toBe(true);

      // 6. Verify user is deleted
      await request(app)
        .get(`/api/users/${userId}`)
        .expect(404);
    });

    it('should handle filtering and pagination', async () => {
      // Create multiple users
      const users = [
        { name: 'Alice Johnson', email: 'alice@example.com', age: 25 },
        { name: 'Bob Smith', email: 'bob@example.com', age: 30 },
        { name: 'Charlie Brown', email: 'charlie@example.com', age: 35 }
      ];

      for (const user of users) {
        await request(app)
          .post('/api/users')
          .send(user);
      }

      // Test filtering by name
      const nameFilterResponse = await request(app)
        .get('/api/users?name=Alice')
        .expect(200);

      expect(nameFilterResponse.body.data.length).toBe(1);
      expect(nameFilterResponse.body.data[0].name).toContain('Alice');

      // Test filtering by age
      const ageFilterResponse = await request(app)
        .get('/api/users?age=30')
        .expect(200);

      expect(ageFilterResponse.body.data.length).toBe(1);
      expect(ageFilterResponse.body.data[0].age).toBe(30);

      // Test pagination
      const paginationResponse = await request(app)
        .get('/api/users?limit=2&offset=1')
        .expect(200);

      expect(paginationResponse.body.data.length).toBeLessThanOrEqual(2);
    });
  });

  describe('Admin API Integration', () => {
    it('should handle admin operations', async () => {
      // Create some test data
      await request(app)
        .post('/api/users')
        .send({ name: 'Admin Test User', email: 'admin@example.com', age: 40 });

      // Test database statistics
      const statsResponse = await request(app)
        .get('/api/admin/database/stats')
        .expect(200);

      expect(statsResponse.body.success).toBe(true);
      expect(statsResponse.body.data.total_users).toBeGreaterThan(0);

      // Test indexes information
      const indexesResponse = await request(app)
        .get('/api/admin/database/indexes')
        .expect(200);

      expect(indexesResponse.body.success).toBe(true);
      expect(Array.isArray(indexesResponse.body.data)).toBe(true);

      // Test query analysis
      const analysisResponse = await request(app)
        .post('/api/admin/database/analyze')
        .send({
          query: 'SELECT * FROM users WHERE age > ?',
          params: [30]
        })
        .expect(200);

      expect(analysisResponse.body.success).toBe(true);
      expect(Array.isArray(analysisResponse.body.data)).toBe(true);

      // Test database optimization
      const optimizeResponse = await request(app)
        .post('/api/admin/database/optimize')
        .expect(200);

      expect(optimizeResponse.body.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/non-existent-route')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });

    it('should handle invalid JSON', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(500); // Express returns 500 for invalid JSON

      expect(response.body.success).toBe(false);
    });
  });
});
