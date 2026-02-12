import { ApiError } from '../utils/apiError.js';
import { logger } from '../utils/logger.js';
import config from '../config/index.js';
import axios from 'axios'; // Assuming axios is installed or will be.

// Placeholder for WSA API base URL
const WSA_API_BASE_URL = process.env.WSA_API_BASE_URL || 'https://api.worldsandboxalliance.com';
const WSA_API_KEY = process.env.WSA_API_KEY;

/**
 * Submits a sub-task to the World Sandbox Alliance (WSA) for processing.
 * @param {object} subTaskData - The data for the sub-task to be processed by WSA.
 * @returns {Promise<object>} The response from the WSA API, typically containing a job ID.
 */
const submitSubTaskToWSA = async (subTaskData) => {
    if (!WSA_API_KEY) {
        logger.error('WSA_API_KEY is not configured.');
        throw new ApiError(500, 'WSA integration not configured.');
    }

    try {
        logger.info(`Submitting sub-task to WSA for task ${subTaskData.taskId}...`);
        const response = await axios.post(`${WSA_API_BASE_URL}/submit-task`, subTaskData, {
            headers: {
                'Authorization': `Bearer ${WSA_API_KEY}`,
                'Content-Type': 'application/json',
            },
        });
        logger.info(`Sub-task submitted to WSA. Job ID: ${response.data.jobId}`);
        return response.data;
    } catch (error) {
        logger.error(`Failed to submit sub-task to WSA: ${error.message}`);
        throw new ApiError(500, `WSA API error: ${error.message}`);
    }
};

/**
 * Polls the WSA API for the status and results of a submitted job.
 * @param {string} jobId - The job ID returned by WSA upon sub-task submission.
 * @returns {Promise<object>} The job status and results from WSA.
 */
const pollWSAJobStatus = async (jobId) => {
    if (!WSA_API_KEY) {
        logger.error('WSA_API_KEY is not configured.');
        throw new ApiError(500, 'WSA integration not configured.');
    }

    try {
        logger.info(`Polling WSA for job status: ${jobId}...`);
        const response = await axios.get(`${WSA_API_BASE_URL}/job-status/${jobId}`, {
            headers: {
                'Authorization': `Bearer ${WSA_API_KEY}`,
            },
        });
        logger.debug(`WSA job ${jobId} status: ${response.data.status}`);
        return response.data;
    } catch (error) {
        logger.error(`Failed to poll WSA job status ${jobId}: ${error.message}`);
        throw new ApiError(500, `WSA API error: ${error.message}`);
    }
};

export const wsaService = {
    submitSubTaskToWSA,
    pollWSAJobStatus,
};