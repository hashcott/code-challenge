import type sqlite3 from 'sqlite3';
import { dbManager } from '../database/database';
import type { User, CreateUserRequest, UpdateUserRequest, UserFilters } from '../models/User';

/**
 * User Service
 * Handles business logic for user operations
 * Provides CRUD functionality for user management
 */
export class UserService {
  /**
   * Create a new user
   * @param userData User data for creation
   * @returns Promise that resolves to the created user
   */
  async createUser(userData: CreateUserRequest): Promise<User> {
    const db = dbManager.getDatabase();
    
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO users (name, email, age) 
        VALUES (?, ?, ?)
      `;
      
      db.run(query, [userData.name, userData.email, userData.age], function(this: sqlite3.RunResult, err: Error | null) {
        if (err) {
          reject(err);
        } else {
          resolve({
            id: this.lastID,
            name: userData.name,
            email: userData.email,
            age: userData.age,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
      });
    });
  }

  /**
   * Get all users with optional filtering and pagination
   * @param filters Optional filters for name, email, age, limit, and offset
   * @returns Promise that resolves to an array of users
   */
  async getUsers(filters: UserFilters = {}): Promise<User[]> {
    const db = dbManager.getDatabase();
    
    let query = 'SELECT * FROM users WHERE 1=1';
    const params: any[] = [];

    if (filters.name) {
      query += ' AND name LIKE ?';
      params.push(`%${filters.name}%`);
    }

    if (filters.email) {
      query += ' AND email LIKE ?';
      params.push(`%${filters.email}%`);
    }

    if (filters.age) {
      query += ' AND age = ?';
      params.push(filters.age);
    }

    query += ' ORDER BY created_at DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }

    if (filters.offset) {
      query += ' OFFSET ?';
      params.push(filters.offset);
    }

    return new Promise((resolve, reject) => {
      db.all(query, params, (err: Error | null, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows as User[]);
        }
      });
    });
  }

  /**
   * Get a user by their unique identifier
   * @param id User unique identifier
   * @returns Promise that resolves to the user or null if not found
   */
  async getUserById(id: number): Promise<User | null> {
    const db = dbManager.getDatabase();
    
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM users WHERE id = ?';
      
      db.get(query, [id], (err: Error | null, row: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(row as User || null);
        }
      });
    });
  }

  /**
   * Update an existing user
   * @param id User unique identifier
   * @param userData Partial user data for update
   * @returns Promise that resolves to the updated user or null if not found
   */
  async updateUser(id: number, userData: UpdateUserRequest): Promise<User | null> {
    const db = dbManager.getDatabase();
    
    const updateFields: string[] = [];
    const params: any[] = [];

    if (userData.name !== undefined) {
      updateFields.push('name = ?');
      params.push(userData.name);
    }

    if (userData.email !== undefined) {
      updateFields.push('email = ?');
      params.push(userData.email);
    }

    if (userData.age !== undefined) {
      updateFields.push('age = ?');
      params.push(userData.age);
    }

    if (updateFields.length === 0) {
      return this.getUserById(id);
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    return new Promise((resolve, reject) => {
      const query = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
      
      db.run(query, params, function(this: sqlite3.RunResult, err: Error | null) {
        if (err) {
          reject(err);
        } else if (this.changes === 0) {
          resolve(null);
        } else {
          // Return updated user
          db.get('SELECT * FROM users WHERE id = ?', [id], (err: Error | null, row: any) => {
            if (err) {
              reject(err);
            } else {
              resolve(row as User);
            }
          });
        }
      });
    });
  }

  /**
   * Delete a user by their unique identifier
   * @param id User unique identifier
   * @returns Promise that resolves to true if user was deleted, false if not found
   */
  async deleteUser(id: number): Promise<boolean> {
    const db = dbManager.getDatabase();
    
    return new Promise((resolve, reject) => {
      const query = 'DELETE FROM users WHERE id = ?';
      
      db.run(query, [id], function(this: sqlite3.RunResult, err: Error | null) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes > 0);
        }
      });
    });
  }
}
