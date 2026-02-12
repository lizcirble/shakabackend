import { computeService } from '../services/computeService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';

const toggleComputeShare = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { enable } = req.body;

    if (typeof enable !== 'boolean') {
        throw new ApiError(400, 'The "enable" field must be a boolean.');
    }

    const updatedUser = await computeService.toggleComputeShare(userId, enable);

    res.status(200).json({
        success: true,
        message: `ComputeShare ${enable ? 'enabled' : 'disabled'} for user.`,
        user: {
            id: updatedUser.id,
            computes_enabled: updatedUser.computes_enabled,
        },
    });
});

// This endpoint would be called by a worker's device to get a ComputeShare task
// and submit its result. For now, it's a simplified placeholder.
const getAndSubmitComputeShareTask = asyncHandler(async (req, res) => {
    const workerId = req.user.id;
    // In a real scenario, the worker would request a task, and then submit the result.
    // For simplicity, this combines both.
    // This would involve:
    // 1. Finding an available ComputeShare task.
    // 2. Assigning it to the worker.
    // 3. Simulating computation (or receiving results from the worker).
    // 4. Storing results.

    // Placeholder: Assume we have a task to process
    const mockTask = { id: 123, category: 'ComputeShare', data: 'some_compute_input' };

    const result = await computeService.processComputeShareTask(mockTask, workerId);

    res.status(200).json({
        success: true,
        message: 'ComputeShare task processed and result stored.',
        result,
    });
});

export const computeController = {
    toggleComputeShare,
    getAndSubmitComputeShareTask,
};
