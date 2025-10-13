import request from 'supertest';
import { Express } from 'express';

/**
 * Test Helper Utilities
 * Provides common testing functions and utilities
 */

export class TestHelpers {
  /**
   * Create a test user and return the response
   * @param app Express application instance
   * @param userData User data to create
   * @returns Promise that resolves to the response
   */
  static async createTestUser(app: Express, userData: any = {}) {
    const defaultUserData = {
      name: 'Test User',
      email: 'test@example.com',
      age: 30,
      ...userData
    };

    return request(app)
      .post('/api/users')
      .send(defaultUserData);
  }

  /**
   * Create multiple test users
   * @param app Express application instance
   * @param count Number of users to create
   * @returns Promise that resolves to array of responses
   */
  static async createMultipleTestUsers(app: Express, count: number) {
    const promises = [];

    for (let i = 0; i < count; i++) {
      promises.push(
        this.createTestUser(app, {
          name: `Test User ${i}`,
          email: `test${i}@example.com`,
          age: 20 + (i % 50)
        })
      );
    }

    return Promise.all(promises);
  }

  /**
   * Measure execution time of a function
   * @param fn Function to measure
   * @returns Object with execution time and result
   */
  static async measureExecutionTime<T>(fn: () => Promise<T>): Promise<{
    result: T;
    executionTime: number;
  }> {
    const startTime = Date.now();
    const result = await fn();
    const endTime = Date.now();
    
    return {
      result,
      executionTime: endTime - startTime
    };
  }

  /**
   * Run performance test with multiple iterations
   * @param fn Function to test
   * @param iterations Number of iterations
   * @returns Performance statistics
   */
  static async runPerformanceTest<T>(
    fn: () => Promise<T>,
    iterations: number
  ): Promise<{
    results: T[];
    totalTime: number;
    averageTime: number;
    minTime: number;
    maxTime: number;
    requestsPerSecond: number;
  }> {
    const results: T[] = [];
    const times: number[] = [];
    const startTime = Date.now();

    for (let i = 0; i < iterations; i++) {
      const iterationStart = Date.now();
      const result = await fn();
      const iterationEnd = Date.now();
      
      results.push(result);
      times.push(iterationEnd - iterationStart);
    }

    const endTime = Date.now();
    const totalTime = endTime - startTime;
    const averageTime = times.reduce((a, b) => a + b, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const requestsPerSecond = (iterations / (totalTime / 1000));

    return {
      results,
      totalTime,
      averageTime,
      minTime,
      maxTime,
      requestsPerSecond
    };
  }

  /**
   * Generate random user data for testing
   * @param count Number of users to generate
   * @returns Array of user data objects
   */
  static generateRandomUserData(count: number) {
    const users = [];
    const names = ['John', 'Jane', 'Bob', 'Alice', 'Charlie', 'Diana', 'Eve', 'Frank'];
    const domains = ['example.com', 'test.com', 'demo.org'];

    for (let i = 0; i < count; i++) {
      const name = names[Math.floor(Math.random() * names.length)];
      const domain = domains[Math.floor(Math.random() * domains.length)];
      
      users.push({
        name: `${name} ${i}`,
        email: `${name.toLowerCase()}${i}@${domain}`,
        age: 18 + Math.floor(Math.random() * 50)
      });
    }

    return users;
  }

  /**
   * Wait for a specified amount of time
   * @param ms Milliseconds to wait
   * @returns Promise that resolves after the specified time
   */
  static async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clean up test data
   * @param app Express application instance
   * @returns Promise that resolves when cleanup is complete
   */
  static async cleanupTestData(app: Express): Promise<void> {
    try {
      // Get all users
      const response = await request(app).get('/api/users');
      
      if (response.body.success && response.body.data.length > 0) {
        // Delete all users
        const deletePromises = response.body.data.map((user: any) =>
          request(app).delete(`/api/users/${user.id}`)
        );
        
        await Promise.all(deletePromises);
      }
    } catch (error) {
      console.warn('Cleanup failed:', error);
    }
  }

  /**
   * Assert performance metrics
   * @param metrics Performance metrics object
   * @param maxAverageTime Maximum allowed average time
   * @param maxTotalTime Maximum allowed total time
   */
  static assertPerformance(
    metrics: {
      averageTime: number;
      totalTime: number;
      requestsPerSecond: number;
    },
    maxAverageTime: number = 100,
    maxTotalTime: number = 5000
  ) {
    expect(metrics.averageTime).toBeLessThan(maxAverageTime);
    expect(metrics.totalTime).toBeLessThan(maxTotalTime);
    expect(metrics.requestsPerSecond).toBeGreaterThan(0);
  }

  /**
   * Log performance results
   * @param testName Name of the test
   * @param metrics Performance metrics
   */
  static logPerformanceResults(
    testName: string,
    metrics: {
      totalTime: number;
      averageTime: number;
      minTime: number;
      maxTime: number;
      requestsPerSecond: number;
      iterations: number;
    }
  ) {
    console.log(`\n📊 ${testName.toUpperCase()} PERFORMANCE RESULTS:`);
    console.log(`- Iterations: ${metrics.iterations}`);
    console.log(`- Total time: ${metrics.totalTime}ms`);
    console.log(`- Average time: ${metrics.averageTime.toFixed(2)}ms`);
    console.log(`- Min time: ${metrics.minTime}ms`);
    console.log(`- Max time: ${metrics.maxTime}ms`);
    console.log(`- Requests per second: ${metrics.requestsPerSecond.toFixed(2)}`);
  }
}
