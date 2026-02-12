import supabase from '../config/supabaseClient.js';
import { ApiError } from '../utils/apiError.js';
import { logger } from '../utils/logger.js';

/**
 * Toggles the ComputeShare status for a user.
 * @param {string} userId - The ID of the user.
 * @param {boolean} enable - Whether to enable or disable ComputeShare.
 * @returns {Promise<object>} The updated user object.
 */
const toggleComputeShare = async (userId, enable) => {
    const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, computes_enabled')
        .eq('id', userId)
        .single();

    if (userError || !user) {
        throw new ApiError(404, 'User not found.');
    }

    const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({ computes_enabled: enable })
        .eq('id', userId)
        .select()
        .single();

    if (updateError) {
        logger.error(`Failed to toggle ComputeShare for user ${userId}: ${updateError.message}`);
        throw new ApiError(500, 'Failed to update ComputeShare status.');
    }

    logger.info(`ComputeShare for user ${userId} set to: ${enable}`);
    return updatedUser;
};

/**
 * Processes a ComputeShare task. This is a placeholder for actual computation logic.
 * In a real scenario, this would involve running a WASM module, Docker container, etc.
 * @param {object} task - The task object.
 * @param {string} workerId - The ID of the worker performing the computation.
 * @returns {Promise<object>} The result of the computation.
 */
const processComputeShareTask = async (task, workerId) => {
    logger.info(`Processing ComputeShare task ${task.id} by worker ${workerId}...`);

    // Simulate computation
    const computationResult = {
        output: `Computed result for task ${task.id} by worker ${workerId}`,
        processedAt: new Date().toISOString(),
        // Add more detailed results as needed
    };

    // Store the output in Supabase (e.g., in a submissions table or a dedicated compute_results table)
    const { data, error } = await supabase
        .from('compute_results') // Assuming a 'compute_results' table exists
        .insert({
            task_id: task.id,
            worker_id: workerId,
            result: computationResult,
            status: 'completed',
        })
        .select()
        .single();

    if (error) {
        logger.error(`Failed to store ComputeShare result for task ${task.id}: ${error.message}`);
        throw new ApiError(500, 'Failed to store computation result.');
    }

    logger.info(`ComputeShare task ${task.id} processed and result stored.`);
    return data;
};

export const computeService = {
    toggleComputeShare,
    processComputeShareTask,
};
