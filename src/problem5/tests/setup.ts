import { dbManager } from '../src/database/database';

/**
 * Test Setup
 * Configures test environment and database
 */

// Global test timeout
jest.setTimeout(10000);

// Setup test database before all tests
beforeAll(async () => {
  try {
    await dbManager.connect();
    console.log('Test database connected');
  } catch (error) {
    console.error('Failed to connect to test database:', error);
    throw error;
  }
});

// Clean up after all tests
afterAll(async () => {
  try {
    await dbManager.close();
    console.log('Test database connection closed');
  } catch (error) {
    console.error('Error closing test database:', error);
  }
});

// Clean up database before each test
beforeEach(async () => {
  const db = dbManager.getDatabase();
  
  return new Promise((resolve, reject) => {
    // Clear all users data
    db.run('DELETE FROM users', (err: Error | null) => {
      if (err) {
        reject(err);
      } else {
        resolve(undefined);
      }
    });
  });
});
