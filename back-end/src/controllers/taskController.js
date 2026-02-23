import { taskService } from '../services/taskService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { logger } from '../utils/logger.js';

const createTask = asyncHandler(async (req, res) => {
    const taskData = req.body;
    
    // For authenticated users, use their ID
    // For anonymous users, use null (will be handled in service)
    const creatorId = req.isAuthenticated ? req.user.id : null;
    
    if (!taskData) {
        throw new ApiError(400, 'Task data is required.');
    }

    // Additional validation for anonymous users
    if (!req.isAuthenticated) {
        logger.info('Anonymous task creation attempt');
        
        // Stricter limits for anonymous users
        if (taskData.requiredWorkers > 5) {
            throw new ApiError(400, 'Anonymous users are limited to 5 workers. Please authenticate for higher limits.');
        }
        
        // Lower payout limit for anonymous users
        const maxAnonymousPayout = 0.05; // 0.05 ETH
        if (parseFloat(taskData.payoutPerWorker) > maxAnonymousPayout) {
            throw new ApiError(400, `Anonymous users are limited to ${maxAnonymousPayout} ETH per worker. Please authenticate for higher limits.`);
        }
    }

    const createdTask = await taskService.createTask(taskData, creatorId);

    res.status(201).json({
        success: true,
        message: creatorId 
            ? 'Task created successfully as DRAFT. Please proceed to funding.'
            : 'Task created successfully. Please authenticate to fund and activate this task.',
        task: createdTask,
        requiresAuth: !creatorId,
    });
});

const fundTask = asyncHandler(async (req, res) => {
    const { id: taskId } = req.params;
    const userId = req.user.id;

    if (!taskId) {
        throw new ApiError(400, 'Task ID is required.');
    }

    const result = await taskService.fundTask(taskId, userId);

    res.status(200).json({
        success: true,
        message: 'Transaction data prepared. Please sign with your wallet.',
        ...result,
    });
});

const confirmTaskFunding = asyncHandler(async (req, res) => {
    const { id: taskId } = req.params;
    const userId = req.user.id;
    const { txHash } = req.body;

    if (!taskId || !txHash) {
        throw new ApiError(400, 'Task ID and transaction hash are required.');
    }

    const fundedTask = await taskService.confirmTaskFunding(taskId, userId, txHash);

    res.status(200).json({
        success: true,
        message: 'Task successfully funded and confirmed.',
        task: fundedTask,
    });
});

const getTask = asyncHandler(async (req, res) => {
    const { id: taskId } = req.params;

    const task = await taskService.getTaskById(taskId);

    res.status(200).json({
        success: true,
        task,
    });
});

const getMyTasks = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const tasks = await taskService.getTasksByCreator(userId);

    res.status(200).json({
        success: true,
        tasks,
    });
});

const getAvailableTasks = asyncHandler(async (req, res) => {
    const tasks = await taskService.getAvailableTasks();

    res.status(200).json({
        success: true,
        tasks,
    });
});

const getMyAssignedTasks = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const tasks = await taskService.getAssignedTasks(userId);

    res.status(200).json({
        success: true,
        tasks,
    });
});

const requestTask = asyncHandler(async (req, res) => {
    const workerId = req.user.id;

    const assignment = await taskService.assignTaskToWorker(workerId);

    res.status(200).json({
        success: true,
        message: 'Task assigned successfully.',
        assignment,
    });
});

export const taskController = {
    createTask,
    fundTask,
    confirmTaskFunding,
    getTask,
    getMyTasks,
    getAvailableTasks,
    getMyAssignedTasks,
    requestTask,
};
