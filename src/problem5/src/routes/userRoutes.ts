import { Router } from 'express';
import { UserController } from '../controllers/UserController';

/**
 * User Routes
 * Defines all HTTP endpoints for user-related operations
 * Maps HTTP methods to controller methods for CRUD operations
 */

const router = Router();
const userController = new UserController();

// POST /api/users - Create a new user
router.post('/', (req, res) => userController.createUser(req, res));

// GET /api/users - Get all users with optional filters
router.get('/', (req, res) => userController.getUsers(req, res));

// GET /api/users/:id - Get user by ID
router.get('/:id', (req, res) => userController.getUserById(req, res));

// PUT /api/users/:id - Update user
router.put('/:id', (req, res) => userController.updateUser(req, res));

// DELETE /api/users/:id - Delete user
router.delete('/:id', (req, res) => userController.deleteUser(req, res));

export default router;
