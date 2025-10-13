import { Router } from 'express';
import { AdminController } from '../controllers/AdminController';

/**
 * Admin Routes
 * Defines administrative endpoints for database monitoring and optimization
 */

const router = Router();
const adminController = new AdminController();

// GET /api/admin/database/stats - Get database statistics
router.get('/database/stats', (req, res) => adminController.getDatabaseStats(req, res));

// GET /api/admin/database/indexes - Get indexes information
router.get('/database/indexes', (req, res) => adminController.getIndexesInfo(req, res));

// POST /api/admin/database/analyze - Analyze query performance
router.post('/database/analyze', (req, res) => adminController.analyzeQuery(req, res));

// POST /api/admin/database/optimize - Optimize database
router.post('/database/optimize', (req, res) => adminController.optimizeDatabase(req, res));

export default router;
