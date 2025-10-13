import { dbManager } from '../database/database';

/**
 * Database Performance Utilities
 * Provides methods for database performance monitoring and optimization
 */
export class DatabasePerformance {
  /**
   * Get information about all indexes on the users table
   * @returns Promise that resolves to index information
   */
  static async getIndexesInfo(): Promise<any[]> {
    const db = dbManager.getDatabase();
    
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          name,
          sql,
          type,
          tbl_name
        FROM sqlite_master 
        WHERE type = 'index' 
        AND tbl_name = 'users'
        ORDER BY name
      `;
      
      db.all(query, [], (err: Error | null, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  /**
   * Get table statistics and performance information
   * @returns Promise that resolves to table statistics
   */
  static async getTableStats(): Promise<any> {
    const db = dbManager.getDatabase();
    
    return new Promise((resolve, reject) => {
      const queries = [
        // Get row count
        'SELECT COUNT(*) as total_rows FROM users',
        // Get table info
        'PRAGMA table_info(users)',
        // Get index list
        'PRAGMA index_list(users)'
      ];

      const results: any = {};
      let completed = 0;

      queries.forEach((query, index) => {
        if (query.startsWith('PRAGMA')) {
          db.all(query, [], (err: Error | null, rows: any[]) => {
            if (err) {
              reject(err);
              return;
            }
            
            if (query.includes('table_info')) {
              results.table_info = rows;
            } else if (query.includes('index_list')) {
              results.indexes = rows;
            }
            
            completed++;
            if (completed === queries.length) {
              resolve(results);
            }
          });
        } else {
          db.get(query, [], (err: Error | null, row: any) => {
            if (err) {
              reject(err);
              return;
            }
            
            results.total_rows = row.total_rows;
            completed++;
            if (completed === queries.length) {
              resolve(results);
            }
          });
        }
      });
    });
  }

  /**
   * Analyze query performance using EXPLAIN QUERY PLAN
   * @param query SQL query to analyze
   * @param params Query parameters
   * @returns Promise that resolves to query plan
   */
  static async analyzeQuery(query: string, params: any[] = []): Promise<any[]> {
    const db = dbManager.getDatabase();
    
    return new Promise((resolve, reject) => {
      const explainQuery = `EXPLAIN QUERY PLAN ${query}`;
      
      db.all(explainQuery, params, (err: Error | null, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  /**
   * Get database size and performance metrics
   * @returns Promise that resolves to database metrics
   */
  static async getDatabaseMetrics(): Promise<any> {
    const db = dbManager.getDatabase();
    
    return new Promise((resolve, reject) => {
      const queries = [
        'SELECT COUNT(*) as total_users FROM users',
        'SELECT COUNT(*) as users_with_age FROM users WHERE age IS NOT NULL',
        'SELECT MIN(created_at) as oldest_user, MAX(created_at) as newest_user FROM users',
        'SELECT AVG(age) as avg_age FROM users WHERE age IS NOT NULL'
      ];

      const results: any = {};
      let completed = 0;

      queries.forEach((query, index) => {
        db.get(query, [], (err: Error | null, row: any) => {
          if (err) {
            reject(err);
            return;
          }
          
          if (query.includes('total_users')) {
            results.total_users = row.total_users;
          } else if (query.includes('users_with_age')) {
            results.users_with_age = row.users_with_age;
          } else if (query.includes('oldest_user')) {
            results.oldest_user = row.oldest_user;
            results.newest_user = row.newest_user;
          } else if (query.includes('avg_age')) {
            results.avg_age = row.avg_age;
          }
          
          completed++;
          if (completed === queries.length) {
            resolve(results);
          }
        });
      });
    });
  }

  /**
   * Optimize database by running VACUUM and ANALYZE
   * @returns Promise that resolves when optimization is complete
   */
  static async optimizeDatabase(): Promise<void> {
    const db = dbManager.getDatabase();
    
    return new Promise((resolve, reject) => {
      // Run VACUUM to reclaim space and optimize
      db.run('VACUUM', (err: Error | null) => {
        if (err) {
          reject(err);
          return;
        }
        
        // Run ANALYZE to update statistics
        db.run('ANALYZE', (err: Error | null) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    });
  }
}
