const TaskModel = require('../models/taskModel');
const SubmissionModel = require('../models/submissionModel');
const AuditLogModel = require('../models/auditLogModel');
const logger = require('../utils/logger');

/**
 * @file services/computeShareService.js
 * @description Manages ComputeShare tasks, including automatic computation and output storage.
 */

/**
 * Starts computation for a ComputeShare task.
 * This is a conceptual function. In a real system, this would trigger
 * an actual computation process on a worker device or a dedicated compute node.
 * @param {string} taskId - The ID of the ComputeShare task.
 * @param {string} workerId - The ID of the worker/device performing computation.
 * @returns {Promise<Object>} A promise that resolves with the computation result.
 */
const startCompute = async (taskId, workerId) => {
    try {
        const task = await TaskModel.findById(taskId);
        if (!task || task.category !== 'ComputeShare') {
            throw new Error(`Task ${taskId} is not a ComputeShare task or not found.`);
        }

        // Simulate computation
        logger.info(`Starting ComputeShare for task ${taskId} by worker ${workerId}...`);
        const computationResult = {
            output: `Computed data for task ${taskId} by ${workerId}`,
            status: 'completed',
            // ... other computation metadata
        };

        // Store output in Supabase as a submission
        const submission = await SubmissionModel.create({
            task_id: taskId,
            worker_id: workerId,
            submission_content: computationResult,
            device_info: 'ComputeShare Node', // Or actual device info
            status: 'approved', // Auto-approved for ComputeShare
        });

        await AuditLogModel.create({
            user_id: workerId,
            action: 'COMPUTESHARE_COMPLETED',
            details: { taskId, submissionId: submission.id },
        });

        logger.info(`ComputeShare task ${taskId} completed by worker ${workerId}. Submission ${submission.id} created.`);
        return submission;
    } catch (error) {
        logger.error(`Error starting ComputeShare for task ${taskId} by worker ${workerId}: ${error.message}`);
        throw error;
    }
};

/**
 * Stops computation for a ComputeShare task.
 * @param {string} taskId - The ID of the ComputeShare task.
 * @param {string} workerId - The ID of the worker/device performing computation.
 * @returns {Promise<void>}
 */
const stopCompute = async (taskId, workerId) => {
    try {
        // In a real system, this would send a signal to stop the computation process.
        logger.info(`Stopping ComputeShare for task ${taskId} by worker ${workerId}.`);

        await AuditLogModel.create({
            user_id: workerId,
            action: 'COMPUTESHARE_STOPPED',
            details: { taskId },
        });
    } catch (error) {
        logger.error(`Error stopping ComputeShare for task ${taskId} by worker ${workerId}: ${error.message}`);
        throw error;
    }
};

module.exports = {
    startCompute,
    stopCompute,
};
