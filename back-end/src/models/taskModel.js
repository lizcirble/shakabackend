/**
 * @file models/taskModel.js
 * @description Defines the structure and basic operations for the 'tasks' table in Supabase.
 */

const supabase = require('../config/supabaseClient');
const logger = require('../utils/logger');

const TABLE_NAME = 'tasks';

/**
 * Represents a task in the DataRand system.
 * Corresponds to the 'tasks' table in Supabase.
 */
class TaskModel {
    /**
     * Creates a new task entry in the database.
     * @param {Object} taskData - The data for the new task.
     * @param {string} taskData.creator_id - The ID of the user who created the task.
     * @param {string} taskData.category - The category of the task (e.g., 'Image Labeling').
     * @param {string} taskData.instructions - Detailed instructions for the task.
     * @param {number} taskData.payout_per_worker - Payout amount for each worker.
     * @param {number} taskData.number_of_workers - Number of workers required.
     * @param {string} taskData.deadline - The deadline for the task.
     * @param {string} taskData.status - Current status of the task (e.g., 'DRAFT', 'FUNDED').
     * @param {string} taskData.risk_level - Risk level of the task (e.g., 'LOW', 'MEDIUM', 'HIGH').
     * @param {number} taskData.platform_fee - The calculated platform fee for the task.
     * @param {number} taskData.total_payout - The total payout for the task (workers + fee).
     * @returns {Promise<Object>} The created task object.
     */
    static async create(taskData) {
        try {
            const { data, error } = await supabase
                .from(TABLE_NAME)
                .insert([taskData])
                .select()
                .single();

            if (error) throw error;
            logger.info(`Task created: ${data.id}`);
            return data;
        } catch (error) {
            logger.error(`Error creating task: ${error.message}`);
            throw error;
        }
    }

    /**
     * Finds a task by its ID.
     * @param {string} taskId - The ID of the task.
     * @returns {Promise<Object|null>} The task object if found, otherwise null.
     */
    static async findById(taskId) {
        try {
            const { data, error } = await supabase
                .from(TABLE_NAME)
                .select('*')
                .eq('id', taskId)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            return data;
        } catch (error) {
            logger.error(`Error finding task by ID ${taskId}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Updates an existing task's information.
     * @param {string} taskId - The ID of the task to update.
     * @param {Object} updates - The fields to update.
     * @returns {Promise<Object>} The updated task object.
     */
    static async update(taskId, updates) {
        try {
            const { data, error } = await supabase
                .from(TABLE_NAME)
                .update(updates)
                .eq('id', taskId)
                .select()
                .single();

            if (error) throw error;
            logger.info(`Task ${taskId} updated.`);
            return data;
        } catch (error) {
            logger.error(`Error updating task ${taskId}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Finds tasks by a given status.
     * @param {string} status - The status to filter tasks by.
     * @returns {Promise<Array<Object>>} An array of task objects.
     */
    static async findByStatus(status) {
        try {
            const { data, error } = await supabase
                .from(TABLE_NAME)
                .select('*')
                .eq('status', status);

            if (error) throw error;
            return data;
        } catch (error) {
            logger.error(`Error finding tasks by status ${status}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Assigns a worker to a task.
     * @param {string} taskId - The ID of the task.
     * @param {string} workerId - The ID of the worker.
     * @returns {Promise<Object>} The updated task object.
     */
    static async assignWorker(taskId, workerId) {
        try {
            const { data: task, error: fetchError } = await supabase
                .from(TABLE_NAME)
                .select('assigned_workers')
                .eq('id', taskId)
                .single();

            if (fetchError) throw fetchError;

            const currentAssignedWorkers = task.assigned_workers || [];
            if (!currentAssignedWorkers.includes(workerId)) {
                const { data, error } = await supabase
                    .from(TABLE_NAME)
                    .update({ assigned_workers: [...currentAssignedWorkers, workerId] })
                    .eq('id', taskId)
                    .select()
                    .single();

                if (error) throw error;
                logger.info(`Worker ${workerId} assigned to task ${taskId}.`);
                return data;
            }
            return task; // Worker already assigned
        } catch (error) {
            logger.error(`Error assigning worker ${workerId} to task ${taskId}: ${error.message}`);
            throw error;
        }
    }
}

module.exports = TaskModel;
