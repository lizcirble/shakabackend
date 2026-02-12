import supabase from '../config/supabaseClient.js';
import { ApiError } from '../utils/apiError.js';
import { logger } from '../utils/logger.js';
import { escrowService } from './escrowService.js';
import { reputationService } from './reputationService.js';

/**
 * Handles the submission of work for a specific task by a worker.
 * @param {string} submissionId - The ID of the submission record.
 * @param {string} workerId - The ID of the worker submitting the work.
 * @param {object} submissionData - The data being submitted by the worker.
 * @returns {Promise<object>} The updated submission object.
 */
const submitTaskWork = async (submissionId, workerId, submissionData) => {
    // Find the pending submission for this worker and task
    const { data: submission, error: submissionError } = await supabase
        .from('submissions')
        .select('*, task:tasks(*)')
        .eq('id', submissionId)
        .eq('worker_id', workerId)
        .single();

    if (submissionError || !submission) {
        throw new ApiError(404, 'No pending submission found for this task and worker.');
    }

    if (submission.status !== 'pending') {
        throw new ApiError(400, `Submission cannot be updated. Status is: ${submission.status}`);
    }

    // Determine the next status based on the task type
    let nextStatus;
    switch (submission.task.category) {
        case 'Image Labeling':
        case 'Audio Transcription':
            nextStatus = 'pending_approval'; // Requires creator to approve
            break;
        case 'AI Evaluation':
            nextStatus = 'pending_consensus'; // Requires other workers to verify
            break;
        case 'ComputeShare':
            nextStatus = 'completed'; // Auto-approved
            break;
        default:
            throw new ApiError(500, 'Unknown task category for submission.');
    }

    const { data: updatedSubmission, error: updateError } = await supabase
        .from('submissions')
        .update({
            status: nextStatus,
            submission_data: submissionData,
            submitted_at: new Date(),
        })
        .eq('id', submissionId)
        .select()
        .single();

    if (updateError) {
        logger.error(`Failed to update submission ${submissionId}: ${updateError.message}`);
        throw new ApiError(500, 'Failed to save submission.');
    }

    logger.info(`Submission ${submissionId} for task ${submission.task_id} updated to ${nextStatus} by worker ${workerId}.`);
    return updatedSubmission;
};

/**
 * Approves a submission, releases payout, and updates reputation.
 * @param {string} submissionId - The ID of the submission to approve.
 * @param {string} approverId - The ID of the user approving the submission (must be task creator).
 * @returns {Promise<object>} The updated submission object.
 */
const approveSubmission = async (submissionId, approverId) => {
    const { data: submission, error: submissionError } = await supabase
        .from('submissions')
        .select('*, task:tasks(*), worker:users(id, wallet_address)')
        .eq('id', submissionId)
        .single();

    if (submissionError || !submission) {
        throw new ApiError(404, 'Submission not found.');
    }

    if (submission.task.creator_id !== approverId) {
        throw new ApiError(403, 'Only the task creator can approve this submission.');
    }

    if (submission.status !== 'pending_approval') {
        throw new ApiError(400, `Submission cannot be approved. Status is: ${submission.status}`);
    }

    // Update submission status
    const { data: updatedSubmission, error: updateError } = await supabase
        .from('submissions')
        .update({ status: 'approved', approved_at: new Date() })
        .eq('id', submissionId)
        .select()
        .single();

    if (updateError) {
        logger.error(`Failed to approve submission ${submissionId}: ${updateError.message}`);
        throw new ApiError(500, 'Failed to approve submission.');
    }

    // Release payout to worker
    await escrowService.releaseBatchPayouts(submission.task.id, [submission.worker.wallet_address]);

    // Update worker reputation (positive)
    await reputationService.updateUserReputation(submission.worker_id, 10); // Example score change

    // Check if all required submissions for the task are approved
    const { data: remainingSubmissions, error: remainingError } = await supabase
        .from('submissions')
        .select('id')
        .eq('task_id', submission.task.id)
        .neq('status', 'approved')
        .neq('status', 'rejected'); // Exclude approved and rejected submissions

    if (remainingError) {
        logger.error(`Failed to query remaining submissions for task ${submission.task.id}: ${remainingError.message}`);
        // Continue without completing task if query fails
    } else if (remainingSubmissions.length === 0) {
        // All submissions are now approved or rejected, complete the task on-chain
        await escrowService.completeTaskOnChain(submission.task.id);
        // Update task status in DB
        await supabase.from('tasks').update({ status: 'COMPLETED' }).eq('id', submission.task.id);
        logger.info(`Task ${submission.task.id} completed on-chain and in DB.`);
    }

    logger.info(`Submission ${submissionId} approved by ${approverId}.`);
    return updatedSubmission;
};

/**
 * Rejects a submission and updates reputation.
 * @param {string} submissionId - The ID of the submission to reject.
 * @param {string} rejecterId - The ID of the user rejecting the submission (must be task creator).
 * @returns {Promise<object>} The updated submission object.
 */
const rejectSubmission = async (submissionId, rejecterId) => {
    const { data: submission, error: submissionError } = await supabase
        .from('submissions')
        .select('*, task:tasks(*), worker:users(id, wallet_address)')
        .eq('id', submissionId)
        .single();

    if (submissionError || !submission) {
        throw new ApiError(404, 'Submission not found.');
    }

    if (submission.task.creator_id !== rejecterId) {
        throw new ApiError(403, 'Only the task creator can reject this submission.');
    }

    if (submission.status !== 'pending_approval') {
        throw new ApiError(400, `Submission cannot be rejected. Status is: ${submission.status}`);
    }

    // Update submission status
    const { data: updatedSubmission, error: updateError } = await supabase
        .from('submissions')
        .update({ status: 'rejected', rejected_at: new Date() })
        .eq('id', submissionId)
        .select()
        .single();

    if (updateError) {
        logger.error(`Failed to reject submission ${submissionId}: ${updateError.message}`);
        throw new ApiError(500, 'Failed to reject submission.');
    }

    // Update worker reputation (negative)
    await reputationService.updateUserReputation(submission.worker_id, -5); // Example score change

    // Check if all submissions for the task are now either approved or rejected
    const { data: remainingSubmissions, error: remainingError } = await supabase
        .from('submissions')
        .select('id')
        .eq('task_id', submission.task.id)
        .neq('status', 'approved')
        .neq('status', 'rejected');

    if (remainingError) {
        logger.error(`Failed to query remaining submissions for task ${submission.task.id}: ${remainingError.message}`);
        // Continue without cancelling task if query fails
    } else if (remainingSubmissions.length === 0) {
        // All submissions are now approved or rejected. If none were approved, cancel and refund.
        const { data: approvedCount, error: approvedCountError } = await supabase
            .from('submissions')
            .select('id', { count: 'exact' })
            .eq('task_id', submission.task.id)
            .eq('status', 'approved');

        if (approvedCountError) {
            logger.error(`Failed to count approved submissions for task ${submission.task.id}: ${approvedCountError.message}`);
        } else if (approvedCount.count === 0) {
            // No submissions were approved, so cancel the task and refund the creator
            await escrowService.cancelAndRefundOnChain(submission.task.id);
            await supabase.from('tasks').update({ status: 'CANCELLED' }).eq('id', submission.task.id);
            logger.info(`Task ${submission.task.id} cancelled and refunded on-chain and in DB.`);
        }
    }

    logger.info(`Submission ${submissionId} rejected by ${rejecterId}.`);
    return updatedSubmission;
};

/**
 * Evaluates a submission for AI Evaluation tasks, records the evaluation, and checks for consensus.
 * @param {string} submissionId - The ID of the submission being evaluated.
 * @param {string} evaluatorId - The ID of the worker performing the evaluation.
 * @param {boolean} isCorrect - Whether the evaluator deems the submission correct.
 * @returns {Promise<object>} The updated submission object.
 */
const evaluateSubmission = async (submissionId, evaluatorId, isCorrect) => {
    const { data: submission, error: submissionError } = await supabase
        .from('submissions')
        .select('*, task:tasks(*), worker:users(id, wallet_address)')
        .eq('id', submissionId)
        .single();

    if (submissionError || !submission) {
        throw new ApiError(404, 'Submission not found.');
    }

    if (submission.task.category !== 'AI Evaluation') {
        throw new ApiError(400, 'This submission type does not support AI Evaluation consensus.');
    }

    if (submission.status !== 'pending_consensus') {
        throw new ApiError(400, `Submission cannot be evaluated. Status is: ${submission.status}`);
    }

    if (submission.worker_id === evaluatorId) {
        throw new ApiError(400, 'Workers cannot evaluate their own submissions.');
    }

    // Record the evaluation
    const { data: evaluation, error: evaluationError } = await supabase
        .from('evaluations') // Assuming an 'evaluations' table exists
        .insert({
            submission_id: submissionId,
            evaluator_id: evaluatorId,
            is_correct: isCorrect,
        })
        .select()
        .single();

    if (evaluationError) {
        logger.error(`Failed to record evaluation for submission ${submissionId}: ${evaluationError.message}`);
        throw new ApiError(500, 'Failed to record evaluation.');
    }

    // Check for consensus
    const { data: evaluations, error: fetchEvaluationsError } = await supabase
        .from('evaluations')
        .select('is_correct, evaluator:users(reputation_score)')
        .eq('submission_id', submissionId);

    if (fetchEvaluationsError) {
        logger.error(`Failed to fetch evaluations for submission ${submissionId}: ${fetchEvaluationsError.message}`);
        throw new ApiError(500, 'Failed to fetch evaluations.');
    }

    const MIN_EVALUATIONS_FOR_CONSENSUS = 3; // From guide
    if (evaluations.length >= MIN_EVALUATIONS_FOR_CONSENSUS) {
        let totalScore = 0;
        let correctScore = 0;

        for (const evalItem of evaluations) {
            const reputation = evalItem.evaluator?.reputation_score || 1; // Default to 1 if no reputation
            totalScore += reputation;
            if (evalItem.is_correct) {
                correctScore += reputation;
            }
        }

        const consensusThreshold = 0.7; // 70% reputation-weighted consensus
        const isApproved = (correctScore / totalScore) >= consensusThreshold;

        let newSubmissionStatus;
        let reputationChange = 0;

        if (isApproved) {
            newSubmissionStatus = 'approved';
            reputationChange = 10; // Positive for worker
            await escrowService.releaseBatchPayouts(submission.task.id, [submission.worker.wallet_address]);
            logger.info(`Submission ${submissionId} approved by consensus. Worker ${submission.worker_id} paid.`);
        } else {
            newSubmissionStatus = 'rejected';
            reputationChange = -5; // Negative for worker
            logger.info(`Submission ${submissionId} rejected by consensus.`);
        }

        // Update submission status
        const { data: finalSubmission, error: finalUpdateError } = await supabase
            .from('submissions')
            .update({ status: newSubmissionStatus, evaluated_at: new Date() })
            .eq('id', submissionId)
            .select()
            .single();

        if (finalUpdateError) {
            logger.error(`Failed to finalize submission ${submissionId} after consensus: ${finalUpdateError.message}`);
            throw new ApiError(500, 'Failed to finalize submission after consensus.');
        }

        // Update worker reputation
        await reputationService.updateUserReputation(submission.worker_id, reputationChange);

        // Check if all submissions for the task are now approved/rejected
        const { data: remainingSubmissions, error: remainingError } = await supabase
            .from('submissions')
            .select('id')
            .eq('task_id', submission.task.id)
            .neq('status', 'approved')
            .neq('status', 'rejected');

        if (remainingError) {
            logger.error(`Failed to query remaining submissions for task ${submission.task.id}: ${remainingError.message}`);
        } else if (remainingSubmissions.length === 0) {
            const { data: approvedCount, error: approvedCountError } = await supabase
                .from('submissions')
                .select('id', { count: 'exact' })
                .eq('task_id', submission.task.id)
                .eq('status', 'approved');

            if (approvedCountError) {
                logger.error(`Failed to count approved submissions for task ${submission.task.id}: ${approvedCountError.message}`);
            } else if (approvedCount.count > 0) {
                await escrowService.completeTaskOnChain(submission.task.id);
                await supabase.from('tasks').update({ status: 'COMPLETED' }).eq('id', submission.task.id);
                logger.info(`Task ${submission.task.id} completed on-chain and in DB.`);
            } else {
                await escrowService.cancelAndRefundOnChain(submission.task.id);
                await supabase.from('tasks').update({ status: 'CANCELLED' }).eq('id', submission.task.id);
                logger.info(`Task ${submission.task.id} cancelled and refunded on-chain and in DB.`);
            }
        }
        return finalSubmission;
    }

    logger.info(`Evaluation recorded for submission ${submissionId}. Waiting for more evaluations.`);
    return evaluation; // Return the evaluation record if consensus not reached yet
};

export const submissionService = {
    submitTaskWork,
    approveSubmission,
    rejectSubmission,
    evaluateSubmission,
};
