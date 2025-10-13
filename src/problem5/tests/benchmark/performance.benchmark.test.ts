import request from 'supertest';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import userRoutes from '../../src/routes/userRoutes';
import adminRoutes from '../../src/routes/adminRoutes';

/**
 * Performance Benchmark Tests
 * Measures API response times and throughput
 */

describe('API Performance Benchmarks', () => {
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
  });

  describe('User API Performance', () => {
    it('should create users efficiently', async () => {
      const iterations = 100;
      const startTime = Date.now();
      const promises = [];

      for (let i = 0; i < iterations; i++) {
        promises.push(
          request(app)
            .post('/api/users')
            .send({
              name: `User ${i}`,
              email: `user${i}@example.com`,
              age: 20 + (i % 50)
            })
        );
      }

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      const avgTime = totalTime / iterations;

      console.log(`\n📊 CREATE USERS BENCHMARK:`);
      console.log(`- Total requests: ${iterations}`);
      console.log(`- Total time: ${totalTime}ms`);
      console.log(`- Average time per request: ${avgTime.toFixed(2)}ms`);
      console.log(`- Requests per second: ${(iterations / (totalTime / 1000)).toFixed(2)}`);

      // Verify all requests succeeded
      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      });

      // Performance assertions
      expect(avgTime).toBeLessThan(100); // Average should be under 100ms
    }, 30000);

    it('should retrieve users efficiently', async () => {
      const iterations = 200;
      const startTime = Date.now();
      const promises = [];

      for (let i = 0; i < iterations; i++) {
        promises.push(
          request(app)
            .get('/api/users')
        );
      }

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      const avgTime = totalTime / iterations;

      console.log(`\n📊 GET USERS BENCHMARK:`);
      console.log(`- Total requests: ${iterations}`);
      console.log(`- Total time: ${totalTime}ms`);
      console.log(`- Average time per request: ${avgTime.toFixed(2)}ms`);
      console.log(`- Requests per second: ${(iterations / (totalTime / 1000)).toFixed(2)}`);

      // Verify all requests succeeded
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      // Performance assertions
      expect(avgTime).toBeLessThan(50); // Average should be under 50ms
    }, 30000);

    it('should handle concurrent operations efficiently', async () => {
      const concurrentUsers = 50;
      const operationsPerUser = 10;
      const startTime = Date.now();
      const promises = [];

      // Create concurrent users with multiple operations each
      for (let i = 0; i < concurrentUsers; i++) {
        const userPromises = [];
        
        // Create user
        userPromises.push(
          request(app)
            .post('/api/users')
            .send({
              name: `Concurrent User ${i}`,
              email: `concurrent${i}@example.com`,
              age: 25 + i
            })
        );

        // Multiple read operations
        for (let j = 0; j < operationsPerUser; j++) {
          userPromises.push(
            request(app)
              .get('/api/users')
          );
        }

        promises.push(Promise.all(userPromises));
      }

      const results = await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      const totalOperations = concurrentUsers * (1 + operationsPerUser);
      const avgTime = totalTime / totalOperations;

      console.log(`\n📊 CONCURRENT OPERATIONS BENCHMARK:`);
      console.log(`- Concurrent users: ${concurrentUsers}`);
      console.log(`- Operations per user: ${operationsPerUser}`);
      console.log(`- Total operations: ${totalOperations}`);
      console.log(`- Total time: ${totalTime}ms`);
      console.log(`- Average time per operation: ${avgTime.toFixed(2)}ms`);
      console.log(`- Operations per second: ${(totalOperations / (totalTime / 1000)).toFixed(2)}`);

      // Performance assertions
      expect(avgTime).toBeLessThan(75); // Average should be under 75ms
    }, 60000);
  });

  describe('Database Performance Benchmarks', () => {
    it('should handle large dataset queries efficiently', async () => {
      // Create a large dataset
      const datasetSize = 1000;
      console.log(`\n📊 Creating ${datasetSize} users for large dataset test...`);
      
      const createStartTime = Date.now();
      const createPromises = [];

      for (let i = 0; i < datasetSize; i++) {
        createPromises.push(
          request(app)
            .post('/api/users')
            .send({
              name: `Large Dataset User ${i}`,
              email: `large${i}@example.com`,
              age: 18 + (i % 60)
            })
        );
      }

      await Promise.all(createPromises);
      const createEndTime = Date.now();
      const createTime = createEndTime - createStartTime;

      console.log(`- Dataset creation time: ${createTime}ms`);
      console.log(`- Average creation time per user: ${(createTime / datasetSize).toFixed(2)}ms`);

      // Test various query patterns
      const queryTests = [
        { name: 'Get all users', query: '/api/users' },
        { name: 'Filter by age', query: '/api/users?age=25' },
        { name: 'Filter by name', query: '/api/users?name=Large' },
        { name: 'Pagination', query: '/api/users?limit=100&offset=0' },
        { name: 'Complex filter', query: '/api/users?age=25&name=Large&limit=50' }
      ];

      for (const test of queryTests) {
        const queryStartTime = Date.now();
        const iterations = 10;
        const promises = [];

        for (let i = 0; i < iterations; i++) {
          promises.push(request(app).get(test.query));
        }

        const responses = await Promise.all(promises);
        const queryEndTime = Date.now();
        const queryTime = queryEndTime - queryStartTime;
        const avgQueryTime = queryTime / iterations;

        console.log(`\n📊 ${test.name.toUpperCase()} BENCHMARK:`);
        console.log(`- Query: ${test.query}`);
        console.log(`- Iterations: ${iterations}`);
        console.log(`- Total time: ${queryTime}ms`);
        console.log(`- Average time per query: ${avgQueryTime.toFixed(2)}ms`);
        console.log(`- Queries per second: ${(iterations / (queryTime / 1000)).toFixed(2)}`);

        // Verify all queries succeeded
        responses.forEach(response => {
          expect(response.status).toBe(200);
          expect(response.body.success).toBe(true);
        });

        // Performance assertions
        expect(avgQueryTime).toBeLessThan(200); // Average should be under 200ms
      }
    }, 120000);

    it('should handle database statistics efficiently', async () => {
      const iterations = 50;
      const startTime = Date.now();
      const promises = [];

      for (let i = 0; i < iterations; i++) {
        promises.push(
          request(app)
            .get('/api/admin/database/stats')
        );
      }

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      const avgTime = totalTime / iterations;

      console.log(`\n📊 DATABASE STATISTICS BENCHMARK:`);
      console.log(`- Total requests: ${iterations}`);
      console.log(`- Total time: ${totalTime}ms`);
      console.log(`- Average time per request: ${avgTime.toFixed(2)}ms`);
      console.log(`- Requests per second: ${(iterations / (totalTime / 1000)).toFixed(2)}`);

      // Verify all requests succeeded
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      // Performance assertions
      expect(avgTime).toBeLessThan(100); // Average should be under 100ms
    }, 30000);
  });

  describe('Memory and Resource Usage', () => {
    it('should maintain stable performance under load', async () => {
      const loadTestDuration = 30000; // 30 seconds
      const requestInterval = 100; // 100ms between requests
      const startTime = Date.now();
      const results: number[] = [];

      console.log(`\n📊 LOAD TEST: Running for ${loadTestDuration / 1000} seconds...`);

      const loadTest = setInterval(async () => {
        const requestStart = Date.now();
        
        try {
          await request(app).get('/api/users');
          const requestEnd = Date.now();
          results.push(requestEnd - requestStart);
        } catch (error) {
          console.error('Request failed during load test:', error);
        }
      }, requestInterval);

      // Wait for load test duration
      await new Promise(resolve => setTimeout(resolve, loadTestDuration));
      clearInterval(loadTest);

      const endTime = Date.now();
      const totalTime = endTime - startTime;
      const totalRequests = results.length;
      const avgResponseTime = results.reduce((a, b) => a + b, 0) / results.length;
      const maxResponseTime = Math.max(...results);
      const minResponseTime = Math.min(...results);

      console.log(`\n📊 LOAD TEST RESULTS:`);
      console.log(`- Test duration: ${totalTime}ms`);
      console.log(`- Total requests: ${totalRequests}`);
      console.log(`- Average response time: ${avgResponseTime.toFixed(2)}ms`);
      console.log(`- Min response time: ${minResponseTime}ms`);
      console.log(`- Max response time: ${maxResponseTime}ms`);
      console.log(`- Requests per second: ${(totalRequests / (totalTime / 1000)).toFixed(2)}`);

      // Performance assertions
      expect(avgResponseTime).toBeLessThan(150); // Average should be under 150ms
      expect(maxResponseTime).toBeLessThan(1000); // Max should be under 1 second
    }, 40000);
  });
});
