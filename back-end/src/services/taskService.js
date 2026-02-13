import { ethers } from 'ethers';
import supabase from '../config/supabaseClient.js';
import { ApiError } from '../utils/apiError.js';
import { logger } from '../utils/logger.js';
import { escrowService } from './escrowService.js';
import { wsaService } from './wsaService.js'; // Import wsaService

const PLATFORM_FEE_PERCENTAGE = 15; // 15%

// A simple keyword scanner for harmful content.
// In a real application, this would be a more sophisticated service.
const FORBIDDEN_KEYWORDS = ['hack', 'illegal', 'malicious', 'attack'];

// Thresholds for task splitting and WSA offloading (example values)
const LARGE_TASK_WORKER_THRESHOLD = 50;
const COMPLEX_TASK_CATEGORIES = ['AI Evaluation'];

/**
 * Validates task input data.
 * @param {object} taskData - The data for the new task.
 * @param {object} creator - The user object of the creator.
 */
const validateTaskInput = (taskData, creator) => {
    const { title, description, category, payoutPerWorker, requiredWorkers } = taskData;
    if (!title || !description || !category || !payoutPerWorker || !requiredWorkers) {
        throw new ApiError(400, 'Missing required task fields.');
    }

    if (requiredWorkers < 1) {
        throw new ApiError(400, 'At least one worker is required.');
    }

    // First-time creator caps - only if the column exists
    if (creator.is_first_task === true || creator.is_first_task === 'true') {
        if (requiredWorkers > 10) {
            throw new ApiError(400, 'First-time creators are limited to 10 workers.');
        }
        const maxPayout = ethers.parseEther('0.1'); // e.g., 0.1 ETH
        if (ethers.parseEther(payoutPerWorker.toString()) > maxPayout) {
            throw new ApiError(400, `First-time creators are limited to a payout of ${ethers.formatEther(maxPayout)} ETH per worker.`);
        }
    }

    // Keyword scan
    const combinedText = `${title} ${description}`.toLowerCase();
    if (FORBIDDEN_KEYWORDS.some(keyword => combinedText.includes(keyword))) {
        throw new ApiError(400, 'Task contains potentially harmful content and cannot be created.');
    }
};

/**
 * Helper function to split a large task into sub-tasks and offload to WSA.
 * @param {object} task - The task object to split.
 * @returns {Promise<void>}
 */
const splitAndOffloadToWSA = async (task) => {
    const isLargeTask = task.required_workers > LARGE_TASK_WORKER_THRESHOLD;
    const isComplexTask = COMPLEX_TASK_CATEGORIES.includes(task.category);

    if (isLargeTask || isComplexTask) {
        logger.info(`Task ${task.id} identified as large/complex. Splitting and offloading to WSA.`);
        // In a real scenario, this would involve actual task splitting logic
        // and creating multiple sub-tasks in the database.
        const subTaskData = {
            taskId: task.id,
            taskType: task.category,
            inputData: task.description, // Example: sending description as input
            // ... other relevant task data for WSA
        };
        try {
            const wsaJob = await wsaService.submitSubTaskToWSA(subTaskData);
            // Store WSA job ID in the task or a dedicated table for tracking
            await supabase.from('tasks').update({ wsa_job_id: wsaJob.jobId, status: 'WSA_PROCESSING' }).eq('id', task.id);
            logger.info(`Task ${task.id} offloaded to WSA with job ID: ${wsaJob.jobId}`);
        } catch (error) {
            logger.error(`Failed to offload task ${task.id} to WSA: ${error.message}`);
            // Depending on policy, might revert task creation or mark for manual review
        }
    }
};

/**
 * Creates a new task as a DRAFT in the database and on-chain.
 * @param {object} taskData - The data for the new task from the request.
 * @param {string} creatorId - The ID of the user creating the task.
 * @returns {Promise<object>} The newly created task object.
 */
const createTask = async (taskData, creatorId) => {
    const { data: creator, error: creatorError } = await supabase
        .from('users')
        .select('id, wallet_address, is_first_task')
        .eq('id', creatorId)
        .single();

    if (creatorError || !creator) {
        throw new ApiError(404, 'Task creator not found.');
    }

    validateTaskInput(taskData, creator);

    const { title, description, category, payoutPerWorker, requiredWorkers, deadline } = taskData;

    const payoutInWei = ethers.parseEther(payoutPerWorker.toString());
    const subtotal = payoutInWei * BigInt(requiredWorkers);
    const platformFee = (subtotal * BigInt(PLATFORM_FEE_PERCENTAGE)) / 100n;
    const totalCost = subtotal + platformFee;

    const newTask = {
        title,
        description,
        category,
        creator_id: creatorId,
        payout_per_worker: payoutInWei.toString(),
        required_workers: requiredWorkers,
        platform_fee: platformFee.toString(),
        total_cost: totalCost.toString(),
        status: 'DRAFT', // Initial status
        deadline,
    };

    const { data: createdTask, error: insertError } = await supabase
        .from('tasks')
        .insert(newTask)
        .select()
        .single();

    if (insertError) {
        logger.error(`Failed to create task in DB: ${insertError.message}`);
        throw new ApiError(500, 'Failed to save task to database.');
    }

    // After successfully saving to DB, create the task on-chain
    await escrowService.createTaskOnChain(
        createdTask.id,
        creator.wallet_address,
        payoutInWei.toString(),
        requiredWorkers
    );

    // Check if the task needs to be split and offloaded to WSA
    await splitAndOffloadToWSA(createdTask);

    return { ...createdTask, total_cost_eth: ethers.formatEther(totalCost) };
};

/**
 * Funds a task by calling the on-chain escrow service and updating its status.
 * @param {number} taskId - The ID of the task to fund.
 * @param {string} userId - The ID of the user attempting to fund the task.
 * @returns {Promise<object>} The updated task object.
 */
const fundTask = async (taskId, userId) => {
    const { data: task, error: taskError } = await supabase
        .from('tasks')
        .select('*, creator:users(id, wallet_address)')
        .eq('id', taskId)
        .single();

    if (taskError || !task) {
        throw new ApiError(404, 'Task not found.');
    }

    if (task.creator_id !== userId) {
        throw new ApiError(403, 'Only the task creator can fund this task.');
    }

    if (task.status !== 'DRAFT') {
        throw new ApiError(400, `Task cannot be funded. Status is: ${task.status}`);
    }

    // Call the on-chain funding function
    await escrowService.fundTaskOnChain(
        task.id,
        task.creator.wallet_address,
        task.total_cost
    );

    // If on-chain funding is successful, update the DB status
    const { data: updatedTask, error: updateError } = await supabase
        .from('tasks')
        .update({ status: 'FUNDED' })
        .eq('id', taskId)
        .select()
        .single();

    if (updateError) {
        logger.error(`Failed to update task status to FUNDED for task ${taskId}: ${updateError.message}`);
        // Note: At this point, the contract is funded but the DB is not updated.
        // A reconciliation job might be needed for production to handle such cases.
        throw new ApiError(500, 'Task was funded on-chain, but failed to update status in database.');
    }

    logger.info(`Task ${taskId} successfully funded and status updated to FUNDED.`);
    return updatedTask;
};

/**
 * Finds and assigns an available task to a worker.
 * @param {string} workerId - The ID of the user requesting a task.
 * @returns {Promise<object>} The assigned task and submission details.
 */
const assignTaskToWorker = async (workerId) => {
    const { data: worker, error: workerError } = await supabase
        .from('users')
        .select('id, wallet_address')
        .eq('id', workerId)
        .single();

    if (workerError || !worker) {
        throw new ApiError(404, 'Worker not found.');
    }

    // Find a task that is funded, not created by the worker, and has open slots.
    // This is a simplified query. A real system would use a more complex matching algorithm
    // based on reputation, worker skills, etc. and would need to handle concurrency.
    const { data: availableTask, error: taskError } = await supabase.rpc('find_available_task', {
        requesting_worker_id: workerId
    }).single();
    
    if (taskError || !availableTask) {
        throw new ApiError(404, 'No available tasks at the moment.');
    }

    // Create a submission record to represent the "reservation" of the task.
    // The TTL logic would be implemented here (e.g., with a scheduled job).
    const { data: submission, error: submissionError } = await supabase
        .from('submissions')
        .insert({
            task_id: availableTask.id,
            worker_id: workerId,
            status: 'pending', // This worker is now working on the task
        })
        .select()
        .single();

    if (submissionError) {
        logger.error(`Failed to create submission: ${submissionError.message}`);
        throw new ApiError(500, 'Failed to reserve task for worker.');
    }

    // Assign the worker on-chain
    await escrowService.assignWorkersOnChain(availableTask.id, [worker.wallet_address]);

    logger.info(`Task ${availableTask.id} assigned to worker ${workerId}. Submission ID: ${submission.id}`);

    return { task: availableTask, submission };
};

const getTaskById = async (taskId) => {
    const { data: task, error } = await supabase
        .from('tasks')
        .select('*, creator:users(id, wallet_address)')
        .eq('id', taskId)
        .single();

    if (error || !task) {
        throw new ApiError(404, 'Task not found.');
    }

    return task;
};

const getTasksByCreator = async (creatorId) => {
    const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('creator_id', creatorId)
        .order('created_at', { ascending: false });

    if (error) {
        throw new ApiError(500, 'Failed to fetch tasks.');
    }

    return tasks || [];
};

const getAvailableTasks = async () => {
    const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('status', 'FUNDED')
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) {
        throw new ApiError(500, 'Failed to fetch available tasks.');
    }

    return tasks || [];
};

const getAssignedTasks = async (workerId) => {
    const { data: submissions, error } = await supabase
        .from('submissions')
        .select('*, task:tasks(*)')
        .eq('worker_id', workerId)
        .order('created_at', { ascending: false });

    if (error) {
        throw new ApiError(500, 'Failed to fetch assigned tasks.');
    }

    return submissions || [];
};

export const taskService = {
    createTask,
    fundTask,
    assignTaskToWorker,
    getTaskById,
    getTasksByCreator,
    getAvailableTasks,
    getAssignedTasks,
};
