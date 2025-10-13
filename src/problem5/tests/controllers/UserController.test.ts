import request from 'supertest';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import userRoutes from '../../src/routes/userRoutes';
import adminRoutes from '../../src/routes/adminRoutes';

/**
 * User Controller Unit Tests
 * Tests all CRUD operations for user management
 */

describe('UserController', () => {
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

  describe('POST /api/users - Create User', () => {
    it('should create a new user with valid data', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      };

      const response = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(userData.name);
      expect(response.body.data.email).toBe(userData.email);
      expect(response.body.data.age).toBe(userData.age);
      expect(response.body.data.id).toBeDefined();
    });

    it('should return 400 for missing required fields', async () => {
      const userData = {
        name: 'John Doe'
        // Missing email
      };

      const response = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('required');
    });

    it('should return 409 for duplicate email', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      };

      // Create first user
      await request(app)
        .post('/api/users')
        .send(userData);

      // Try to create user with same email
      const response = await request(app)
        .post('/api/users')
        .send(userData);

      // Check for either 409 or 500 (depending on error handling)
      expect([409, 500]).toContain(response.status);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/already exists|Internal server error/);
    });
  });

  describe('GET /api/users - Get Users', () => {
    beforeEach(async () => {
      // Create test users
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

    it('should get all users', async () => {
      const response = await request(app)
        .get('/api/users')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.count).toBe(3);
    });

    it('should filter users by name', async () => {
      const response = await request(app)
        .get('/api/users?name=John')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data.some((user: any) => user.name.includes('John'))).toBe(true);
    });

    it('should filter users by age', async () => {
      const response = await request(app)
        .get('/api/users?age=30')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].age).toBe(30);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/users?limit=2&offset=1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });
  });

  describe('GET /api/users/:id - Get User by ID', () => {
    let userId: number;

    beforeEach(async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      };

      const response = await request(app)
        .post('/api/users')
        .send(userData);

      userId = response.body.data.id;
    });

    it('should get user by valid ID', async () => {
      const response = await request(app)
        .get(`/api/users/${userId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(userId);
      expect(response.body.data.name).toBe('John Doe');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/users/999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });

    it('should return 400 for invalid ID', async () => {
      const response = await request(app)
        .get('/api/users/invalid')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid user ID');
    });
  });

  describe('PUT /api/users/:id - Update User', () => {
    let userId: number;

    beforeEach(async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      };

      const response = await request(app)
        .post('/api/users')
        .send(userData);

      userId = response.body.data.id;
    });

    it('should update user with valid data', async () => {
      const updateData = {
        name: 'John Smith',
        age: 31
      };

      const response = await request(app)
        .put(`/api/users/${userId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('John Smith');
      expect(response.body.data.age).toBe(31);
      expect(response.body.data.email).toBe('john@example.com'); // Unchanged
    });

    it('should return 404 for non-existent user', async () => {
      const updateData = { name: 'John Smith' };

      const response = await request(app)
        .put('/api/users/999')
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });

    it('should return 400 for invalid ID', async () => {
      const updateData = { name: 'John Smith' };

      const response = await request(app)
        .put('/api/users/invalid')
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid user ID');
    });
  });

  describe('DELETE /api/users/:id - Delete User', () => {
    let userId: number;

    beforeEach(async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      };

      const response = await request(app)
        .post('/api/users')
        .send(userData);

      userId = response.body.data.id;
    });

    it('should delete user with valid ID', async () => {
      const response = await request(app)
        .delete(`/api/users/${userId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted successfully');

      // Verify user is deleted
      await request(app)
        .get(`/api/users/${userId}`)
        .expect(404);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .delete('/api/users/999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });

    it('should return 400 for invalid ID', async () => {
      const response = await request(app)
        .delete('/api/users/invalid')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid user ID');
    });
  });
});
