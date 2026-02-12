import express from 'express';
import { computeController } from '../controllers/computeController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// All compute routes are protected and require a valid JWT
router.use(authMiddleware);

// Route to toggle ComputeShare on/off for a user
router.post('/toggle', computeController.toggleComputeShare);

// Route for a worker to get and submit a ComputeShare task
router.post('/process', computeController.getAndSubmitComputeShareTask);

export default router;
