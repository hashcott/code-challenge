import { Request, Response } from 'express';
import { DatabasePerformance } from '../utils/databasePerformance';

/**
 * Admin Controller
 * Handles administrative operations and database performance monitoring
 */
export class AdminController {
  /**
   * @swagger
   * /api/admin/database/stats:
   *   get:
   *     summary: Get database statistics
   *     description: Retrieves comprehensive database performance statistics and metrics
   *     tags: [Admin]
   *     responses:
   *       200:
   *         description: Database statistics retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       type: object
   *                       properties:
   *                         total_users:
   *                           type: integer
   *                           description: Total number of users
   *                         users_with_age:
   *                           type: integer
   *                           description: Number of users with age information
   *                         oldest_user:
   *                           type: string
   *                           format: date-time
   *                           description: Creation date of oldest user
   *                         newest_user:
   *                           type: string
   *                           format: date-time
   *                           description: Creation date of newest user
   *                         avg_age:
   *                           type: number
   *                           description: Average age of users
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  async getDatabaseStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await DatabasePerformance.getDatabaseMetrics();
      
      res.status(200).json({
        success: true,
        data: stats,
        message: 'Database statistics retrieved successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve database statistics',
        error: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/admin/database/indexes:
   *   get:
   *     summary: Get database indexes information
   *     description: Retrieves information about all database indexes for performance monitoring
   *     tags: [Admin]
   *     responses:
   *       200:
   *         description: Indexes information retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           name:
   *                             type: string
   *                             description: Index name
   *                           sql:
   *                             type: string
   *                             description: SQL definition of the index
   *                           type:
   *                             type: string
   *                             description: Index type
   *                           tbl_name:
   *                             type: string
   *                             description: Table name
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  async getIndexesInfo(req: Request, res: Response): Promise<void> {
    try {
      const indexes = await DatabasePerformance.getIndexesInfo();
      
      res.status(200).json({
        success: true,
        data: indexes,
        message: 'Indexes information retrieved successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve indexes information',
        error: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/admin/database/analyze:
   *   post:
   *     summary: Analyze query performance
   *     description: Analyzes the performance of a SQL query using EXPLAIN QUERY PLAN
   *     tags: [Admin]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [query]
   *             properties:
   *               query:
   *                 type: string
   *                 description: SQL query to analyze
   *                 example: "SELECT * FROM users WHERE name LIKE ? ORDER BY created_at DESC LIMIT 10"
   *               params:
   *                 type: array
   *                 items:
   *                   type: string
   *                 description: Query parameters
   *                 example: ["%John%"]
   *     responses:
   *       200:
   *         description: Query analysis completed successfully
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           selectid:
   *                             type: integer
   *                           order:
   *                             type: integer
   *                           from:
   *                             type: integer
   *                           detail:
   *                             type: string
   *       400:
   *         description: Bad request - missing query
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  async analyzeQuery(req: Request, res: Response): Promise<void> {
    try {
      const { query, params = [] } = req.body;
      
      if (!query) {
        res.status(400).json({
          success: false,
          message: 'Query is required'
        });
        return;
      }

      const analysis = await DatabasePerformance.analyzeQuery(query, params);
      
      res.status(200).json({
        success: true,
        data: analysis,
        message: 'Query analysis completed successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to analyze query',
        error: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/admin/database/optimize:
   *   post:
   *     summary: Optimize database
   *     description: Runs VACUUM and ANALYZE to optimize database performance
   *     tags: [Admin]
   *     responses:
   *       200:
   *         description: Database optimization completed successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ApiResponse'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  async optimizeDatabase(req: Request, res: Response): Promise<void> {
    try {
      await DatabasePerformance.optimizeDatabase();
      
      res.status(200).json({
        success: true,
        message: 'Database optimization completed successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to optimize database',
        error: error.message
      });
    }
  }
}
