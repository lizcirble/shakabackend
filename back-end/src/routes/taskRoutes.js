import express from 'express';
import { taskController } from '../controllers/taskController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { optionalAuth } from '../middleware/optionalAuth.js';
import { anonymousTaskLimiter } from '../middleware/rateLimitMiddleware.js';

const router = express.Router();

// Public route: Create task (with optional auth and rate limiting)
router.post('/', optionalAuth, anonymousTaskLimiter, taskController.createTask);

// Public route: Get available tasks (no auth required)
router.get('/available', taskController.getAvailableTasks);

// Public route: Get specific task details (no auth required)
router.get('/:id', taskController.getTask);

// Protected routes below - require authentication
router.use(authMiddleware);

// Route to get current user's tasks
router.get('/', taskController.getMyTasks);

// Route to get my assignments (worker)
router.get('/my-assignments', taskController.getMyAssignedTasks);

// Route to fund a task (prepare transaction)
router.post('/:id/fund', taskController.fundTask);

// Route to confirm task funding after user signs transaction
router.post('/:id/confirm-funding', taskController.confirmTaskFunding);

// Route for a worker to request a new task to work on
router.post('/request', taskController.requestTask);

export default router;
