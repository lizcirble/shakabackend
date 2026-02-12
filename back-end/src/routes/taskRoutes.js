import express from 'express';
import { taskController } from '../controllers/taskController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// All task routes are protected and require a valid JWT
router.use(authMiddleware);

// Route to create a new task
router.post('/', taskController.createTask);

// Route to fund a task
// The :id parameter will be the task's ID from the database
router.post('/:id/fund', taskController.fundTask);

// Route for a worker to request a new task to work on
router.post('/request', taskController.requestTask);

export default router;
