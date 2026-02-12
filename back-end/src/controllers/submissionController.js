import { submissionService } from '../services/submissionService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';

const submitWork = asyncHandler(async (req, res) => {
    const { submissionId } = req.params;
    const workerId = req.user.id; // Attached from authMiddleware
    const { submissionData } = req.body;

    if (!submissionId) {
        throw new ApiError(400, 'Submission ID is required.');
    }

    if (!submissionData) {
        throw new ApiError(400, 'Submission data is required.');
    }

    const updatedSubmission = await submissionService.submitTaskWork(
        submissionId,
        workerId,
        submissionData
    );

    res.status(200).json({
        success: true,
        message: 'Work submitted successfully.',
        submission: updatedSubmission,
    });
});

const approveSubmission = asyncHandler(async (req, res) => {
    const { submissionId } = req.params;
    const approverId = req.user.id; // Task creator

    if (!submissionId) {
        throw new ApiError(400, 'Submission ID is required.');
    }

    const approvedSubmission = await submissionService.approveSubmission(submissionId, approverId);

    res.status(200).json({
        success: true,
        message: 'Submission approved successfully.',
        submission: approvedSubmission,
    });
});

const rejectSubmission = asyncHandler(async (req, res) => {
    const { submissionId } = req.params;
    const rejecterId = req.user.id; // Task creator

    if (!submissionId) {
        throw new ApiError(400, 'Submission ID is required.');
    }

    const rejectedSubmission = await submissionService.rejectSubmission(submissionId, rejecterId);

    res.status(200).json({
        success: true,
        message: 'Submission rejected successfully.',
        submission: rejectedSubmission,
    });
});

const evaluateSubmission = asyncHandler(async (req, res) => {
    const { submissionId } = req.params;
    const evaluatorId = req.user.id; // Worker evaluating another submission
    const { isCorrect } = req.body;

    if (!submissionId) {
        throw new ApiError(400, 'Submission ID is required.');
    }
    if (typeof isCorrect !== 'boolean') {
        throw new ApiError(400, 'Evaluation result (isCorrect) must be a boolean.');
    }

    const evaluationResult = await submissionService.evaluateSubmission(
        submissionId,
        evaluatorId,
        isCorrect
    );

    res.status(200).json({
        success: true,
        message: 'Submission evaluation recorded.',
        evaluation: evaluationResult,
    });
});

export const submissionController = {
    submitWork,
    approveSubmission,
    rejectSubmission,
    evaluateSubmission,
};
