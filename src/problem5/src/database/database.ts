import sqlite3, { type Database } from 'sqlite3';

/**
 * Database Manager
 * Handles SQLite database connection and initialization
 * Provides methods for connecting, initializing tables, and closing connections
 */
class DatabaseManager {
  private db: Database | null = null;

  /**
   * Connect to SQLite database
   * Creates database file if it doesn't exist and initializes required tables
   * @returns Promise that resolves when connection is established
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database('./database.sqlite', (err: Error | null) => {
        if (err) {
          console.error('Error opening database:', err);
          reject(err);
        } else {
          console.log('Connected to SQLite database');
          this.initializeTables();
          resolve();
        }
      });
    });
  }

  /**
   * Initialize database tables and indexes
   * Creates the users table and performance indexes if they don't exist
   * @returns Promise that resolves when tables and indexes are initialized
   */
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

    // Performance indexes for common queries
    const createIndexesQueries = [
      // Index for email lookups (already has UNIQUE constraint, but explicit index for performance)
      'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
      
      // Index for name searches (LIKE queries)
      'CREATE INDEX IF NOT EXISTS idx_users_name ON users(name)',
      
      // Index for age filtering
      'CREATE INDEX IF NOT EXISTS idx_users_age ON users(age)',
      
      // Index for created_at ordering (most common sort order)
      'CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC)',
      
      // Composite index for common filter combinations
      'CREATE INDEX IF NOT EXISTS idx_users_name_email ON users(name, email)',
      
      // Index for updated_at for audit queries
      'CREATE INDEX IF NOT EXISTS idx_users_updated_at ON users(updated_at DESC)',
      
      // Composite index for age + created_at (common filtering + sorting)
      'CREATE INDEX IF NOT EXISTS idx_users_age_created_at ON users(age, created_at DESC)'
    ];

    return new Promise((resolve, reject) => {
      this.db!.run(createTableQuery, (err: Error | null) => {
        if (err) {
          console.error('Error creating table:', err);
          reject(err);
          return;
        }
        
        console.log('Users table initialized');
        
        // Create indexes sequentially
        this.createIndexes(createIndexesQueries, 0, resolve, reject);
      });
    });
  }

  /**
   * Create database indexes sequentially
   * @param queries Array of index creation queries
   * @param index Current index being processed
   * @param resolve Promise resolve function
   * @param reject Promise reject function
   */
  private createIndexes(queries: string[], index: number, resolve: () => void, reject: (err: Error) => void): void {
    if (index >= queries.length) {
      console.log('All database indexes created successfully');
      resolve();
      return;
    }

    this.db!.run(queries[index], (err: Error | null) => {
      if (err) {
        console.error(`Error creating index ${index + 1}:`, err);
        reject(err);
        return;
      }
      
      console.log(`Index ${index + 1}/${queries.length} created`);
      this.createIndexes(queries, index + 1, resolve, reject);
    });
  }

  /**
   * Get the database instance
   * @returns SQLite database instance
   * @throws Error if database is not connected
   */
  getDatabase(): Database {
    if (!this.db) {
      throw new Error('Database not connected');
    }
    return this.db;
  }

  /**
   * Close database connection
   * @returns Promise that resolves when connection is closed
   */
  async close(): Promise<void> {
    if (this.db) {
      return new Promise((resolve, reject) => {
        this.db!.close((err: Error | null) => {
          if (err) {
            console.error('Error closing database:', err);
            reject(err);
          } else {
            console.log('Database connection closed');
            resolve();
          }
        });
      });
    }
  }
}

export const dbManager = new DatabaseManager();
