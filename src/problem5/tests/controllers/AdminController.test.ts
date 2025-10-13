import request from 'supertest';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import userRoutes from '../../src/routes/userRoutes';
import adminRoutes from '../../src/routes/adminRoutes';

/**
 * Admin Controller Unit Tests
 * Tests database monitoring and optimization endpoints
 */

describe('AdminController', () => {
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

  beforeEach(async () => {
    // Create test users for statistics
    const users = [
      { name: 'John Doe', email: 'john@example.com', age: 30 },
      { name: 'Jane Smith', email: 'jane@example.com', age: 25 },
      { name: 'Bob Johnson', email: 'bob@example.com', age: 35 }
    ];

    for (const user of users) {
      await request(app)
        .post('/api/users')
        .send(user);
    }
  });

  describe('GET /api/admin/database/stats - Database Statistics', () => {
    it('should return database statistics', async () => {
      const response = await request(app)
        .get('/api/admin/database/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('total_users');
      expect(response.body.data).toHaveProperty('users_with_age');
      expect(response.body.data).toHaveProperty('avg_age');
      expect(response.body.data).toHaveProperty('oldest_user');
      expect(response.body.data).toHaveProperty('newest_user');
      
      expect(response.body.data.total_users).toBe(3);
      expect(response.body.data.users_with_age).toBe(3);
      expect(response.body.data.avg_age).toBe(30); // (30 + 25 + 35) / 3
    });
  });

  describe('GET /api/admin/database/indexes - Indexes Information', () => {
    it('should return indexes information', async () => {
      const response = await request(app)
        .get('/api/admin/database/indexes')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      
      // Check for expected indexes
      const indexNames = response.body.data.map((idx: any) => idx.name);
      expect(indexNames).toContain('idx_users_email');
      expect(indexNames).toContain('idx_users_name');
      expect(indexNames).toContain('idx_users_age');
      expect(indexNames).toContain('idx_users_created_at');
    });
  });

  describe('POST /api/admin/database/analyze - Query Analysis', () => {
    it('should analyze query performance', async () => {
      const queryData = {
        query: 'SELECT * FROM users WHERE name LIKE ? ORDER BY created_at DESC LIMIT 10',
        params: ['%John%']
      };

      const response = await request(app)
        .post('/api/admin/database/analyze')
        .send(queryData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should return 400 for missing query', async () => {
      const response = await request(app)
        .post('/api/admin/database/analyze')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Query is required');
    });

    it('should handle query with parameters', async () => {
      const queryData = {
        query: 'SELECT * FROM users WHERE age = ?',
        params: [30]
      };

      const response = await request(app)
        .post('/api/admin/database/analyze')
        .send(queryData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('POST /api/admin/database/optimize - Database Optimization', () => {
    it('should optimize database successfully', async () => {
      const response = await request(app)
        .post('/api/admin/database/optimize')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('optimization completed');
    });
  });
});
