import sqlite3, { Database } from 'sqlite3';

/**
 * Test Database Configuration
 * Separate database for testing to avoid conflicts with development data
 */

class TestDatabaseManager {
  private db: Database | null = null;

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database('./test-database.sqlite', (err: Error | null) => {
        if (err) {
          console.error('Error opening test database:', err);
          reject(err);
        } else {
          console.log('Connected to test SQLite database');
          this.initializeTables();
          resolve();
        }
      });
    });
  }

  private async initializeTables(): Promise<void> {
    if (!this.db) return;

    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        age INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Performance indexes for testing
    const createIndexesQueries = [
      'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
      'CREATE INDEX IF NOT EXISTS idx_users_name ON users(name)',
      'CREATE INDEX IF NOT EXISTS idx_users_age ON users(age)',
      'CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC)',
      'CREATE INDEX IF NOT EXISTS idx_users_name_email ON users(name, email)',
      'CREATE INDEX IF NOT EXISTS idx_users_updated_at ON users(updated_at DESC)',
      'CREATE INDEX IF NOT EXISTS idx_users_age_created_at ON users(age, created_at DESC)'
    ];

    return new Promise((resolve, reject) => {
      this.db!.run(createTableQuery, (err: Error | null) => {
        if (err) {
          console.error('Error creating test table:', err);
          reject(err);
          return;
        }
        
        console.log('Test users table initialized');
        
        // Create indexes sequentially
        this.createIndexes(createIndexesQueries, 0, resolve, reject);
      });
    });
  }

  private createIndexes(queries: string[], index: number, resolve: () => void, reject: (err: Error) => void): void {
    if (index >= queries.length) {
      console.log('All test database indexes created successfully');
      resolve();
      return;
    }

    this.db!.run(queries[index], (err: Error | null) => {
      if (err) {
        console.error(`Error creating test index ${index + 1}:`, err);
        reject(err);
        return;
      }
      
      this.createIndexes(queries, index + 1, resolve, reject);
    });
  }

  getDatabase(): Database {
    if (!this.db) {
      throw new Error('Test database not connected');
    }
    return this.db;
  }

  async close(): Promise<void> {
    if (this.db) {
      return new Promise((resolve, reject) => {
        this.db!.close((err: Error | null) => {
          if (err) {
            console.error('Error closing test database:', err);
            reject(err);
          } else {
            console.log('Test database connection closed');
            resolve();
          }
        });
      });
    }
  }

  async clearAllData(): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      this.db!.run('DELETE FROM users', (err: Error | null) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}

export const testDbManager = new TestDatabaseManager();
