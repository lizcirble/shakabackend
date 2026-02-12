const TaskModel = require('../models/taskModel');
const UserModel = require('../models/userModel');
const logger = require('../utils/logger');
const { splitTask } = require('../utils/taskSplitting');
const { isDuplicateFingerprint } = require('../utils/deviceFingerprint');

/**
 * @file services/taskAssignmentService.js
 * @description Handles the logic for assigning tasks to eligible workers.
 */

const ASSIGNMENT_TTL_MINUTES = 5; // Time-to-live for task reservation

/**
 * Selects eligible workers for a given task based on various criteria.
 * @param {Object} task - The task object to assign workers to.
 * @returns {Promise<Array<Object>>} An array of eligible worker user objects.
 */
const selectEligibleWorkers = async (task) => {
    // Placeholder for complex worker selection logic
    // In a real system, this would involve:
    // - Querying workers based on skills/preferences
    // - Checking worker availability
    // - Filtering out workers with active tasks (max 1 active task per device fingerprint)
    // - Considering reputation weighting
    // - Geographic location, etc.

    // For now, we'll return a dummy list of workers.
    // In a real scenario, you'd fetch workers from your database.
    const allWorkers = await UserModel.findByPrivyId('privy-user-id-123'); // Example: fetch all users
    if (!allWorkers) return [];

    const eligibleWorkers = [];
    // Simplified eligibility: just return the first few workers
    // In reality, you'd iterate and apply all criteria.
    eligibleWorkers.push(allWorkers); // This is just for demonstration

    return eligibleWorkers;
};

/**
 * Assigns a task to a worker, including atomic reservation and sub-task splitting.
 * @param {string} taskId - The ID of the task to assign.
 * @returns {Promise<Object>} The updated task object with assigned workers.
 * @throws {Error} If no eligible workers are found or assignment fails.
 */
const assignTask = async (taskId) => {
    const task = await TaskModel.findById(taskId);
    if (!task) {
        throw new Error(`Task with ID ${taskId} not found.`);
    }
    if (task.status !== 'FUNDED') {
        throw new Error(`Task ${taskId} is not in FUNDED status and cannot be assigned.`);
    }

    const eligibleWorkers = await selectEligibleWorkers(task);
    if (eligibleWorkers.length === 0) {
        throw new Error(`No eligible workers found for task ${taskId}.`);
    }

    // Atomic reservation with TTL (simplified)
    // In a real system, this would involve a more robust locking mechanism
    // (e.g., Redis lock, database transaction with `FOR UPDATE`).
    // For now, we'll simulate by immediately assigning.

    const assignedWorkerIds = [];
    const subTasks = splitTask(task, task.number_of_workers); // Split task into sub-tasks

    for (let i = 0; i < Math.min(task.number_of_workers, eligibleWorkers.length); i++) {
        const worker = eligibleWorkers[i];
        // Enforce fingerprint uniqueness (simplified: check against currently assigned workers)
        // This would be more complex, checking against active tasks across the network.
        const workerFingerprints = await UserModel.getDeviceFingerprints(worker.id);
        const hasActiveTaskWithSameFingerprint = false; // Placeholder for actual check

        if (!hasActiveTaskWithSameFingerprint) {
            await TaskModel.assignWorker(taskId, worker.id);
            assignedWorkerIds.push(worker.id);
            logger.info(`Worker ${worker.id} assigned to sub-task ${subTasks[i].subTaskId} of task ${taskId}.`);
            // Update sub-task with assigned worker
            subTasks[i].assignedWorker = worker.id;
            // Set reservation TTL (e.g., store in Redis or update task_assignment table)
            // For now, we'll just log.
        } else {
            logger.warn(`Worker ${worker.id} skipped for task ${taskId} due to duplicate fingerprint.`);
        }
    }

    if (assignedWorkerIds.length === 0) {
        throw new Error(`Could not assign any workers to task ${taskId}.`);
    }

    // Update task status to 'ASSIGNED' or 'IN_PROGRESS'
    await TaskModel.update(taskId, { status: 'ASSIGNED', assigned_workers: assignedWorkerIds });

    return { ...task, assigned_workers: assignedWorkerIds, sub_tasks: subTasks };
};

module.exports = {
    assignTask,
    selectEligibleWorkers, // Exported for potential external use or testing
};
