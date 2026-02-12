import express from 'express';
import { submissionController } from '../controllers/submissionController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// All submission routes are protected and require a valid JWT
router.use(authMiddleware);

// Route for a worker to submit their work for a task.
// The :submissionId is the ID of the submission record created during assignment.
router.post('/:submissionId', submissionController.submitWork);

// Route for a task creator to approve a submission
router.post('/:submissionId/approve', submissionController.approveSubmission);

// Route for a task creator to reject a submission
router.post('/:submissionId/reject', submissionController.rejectSubmission);

// Route for a worker to evaluate another worker's submission (for AI Evaluation tasks)
router.post('/:submissionId/evaluate', submissionController.evaluateSubmission);

export default router;
