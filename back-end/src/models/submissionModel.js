/**
 * @file models/submissionModel.js
 * @description Defines the structure and basic operations for the 'submissions' table in Supabase.
 */

const supabase = require('../config/supabaseClient');
const logger = require('../utils/logger');

const TABLE_NAME = 'submissions';

/**
 * Represents a worker's submission for a task in the DataRand system.
 * Corresponds to the 'submissions' table in Supabase.
 */
class SubmissionModel {
    /**
     * Creates a new submission entry in the database.
     * @param {Object} submissionData - The data for the new submission.
     * @param {string} submissionData.task_id - The ID of the task this submission belongs to.
     * @param {string} submissionData.worker_id - The ID of the worker who made the submission.
     * @param {Object} submissionData.submission_content - The actual content of the submission (e.g., image labels, audio transcription).
     * @param {string} submissionData.device_info - Information about the device used for submission.
     * @param {string} [submissionData.status='pending'] - Current status of the submission (e.g., 'pending', 'approved', 'rejected').
     * @returns {Promise<Object>} The created submission object.
     */
    static async create(submissionData) {
        try {
            const { data, error } = await supabase
                .from(TABLE_NAME)
                .insert([submissionData])
                .select()
                .single();

            if (error) throw error;
            logger.info(`Submission created: ${data.id} for task ${data.task_id}`);
            return data;
        } catch (error) {
            logger.error(`Error creating submission for task ${submissionData.task_id}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Finds a submission by its ID.
     * @param {string} submissionId - The ID of the submission.
     * @returns {Promise<Object|null>} The submission object if found, otherwise null.
     */
    static async findById(submissionId) {
        try {
            const { data, error } = await supabase
                .from(TABLE_NAME)
                .select('*')
                .eq('id', submissionId)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            return data;
        } catch (error) {
            logger.error(`Error finding submission by ID ${submissionId}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Finds all submissions for a given task.
     * @param {string} taskId - The ID of the task.
     * @returns {Promise<Array<Object>>} An array of submission objects.
     */
    static async findByTaskId(taskId) {
        try {
            const { data, error } = await supabase
                .from(TABLE_NAME)
                .select('*')
                .eq('task_id', taskId);

            if (error) throw error;
            return data;
        } catch (error) {
            logger.error(`Error finding submissions for task ${taskId}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Updates an existing submission's information.
     * @param {string} submissionId - The ID of the submission to update.
     * @param {Object} updates - The fields to update.
     * @returns {Promise<Object>} The updated submission object.
     */
    static async update(submissionId, updates) {
        try {
            const { data, error } = await supabase
                .from(TABLE_NAME)
                .update(updates)
                .eq('id', submissionId)
                .select()
                .single();

            if (error) throw error;
            logger.info(`Submission ${submissionId} updated.`);
            return data;
        } catch (error) {
            logger.error(`Error updating submission ${submissionId}: ${error.message}`);
            throw error;
        }
    }
}

module.exports = SubmissionModel;
