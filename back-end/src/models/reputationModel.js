/**
 * @file models/reputationModel.js
 * @description Defines the structure and basic operations for the 'reputation' table in Supabase.
 */

const supabase = require('../config/supabaseClient');
const logger = require('../utils/logger');

const TABLE_NAME = 'reputation';

/**
 * Represents a worker's reputation in the DataRand system.
 * Corresponds to the 'reputation' table in Supabase.
 */
class ReputationModel {
    /**
     * Creates a new reputation entry for a worker.
     * @param {Object} reputationData - The data for the new reputation entry.
     * @param {string} reputationData.worker_id - The ID of the worker.
     * @param {number} [reputationData.score=100] - The initial reputation score.
     * @param {number} [reputationData.accuracy=0] - Accuracy metric.
     * @param {number} [reputationData.completion_rate=0] - Completion rate metric.
     * @param {number} [reputationData.reliability=0] - Reliability metric.
     * @returns {Promise<Object>} The created reputation object.
     */
    static async create(reputationData) {
        try {
            const { data, error } = await supabase
                .from(TABLE_NAME)
                .insert([reputationData])
                .select()
                .single();

            if (error) throw error;
            logger.info(`Reputation created for worker: ${data.worker_id}`);
            return data;
        } catch (error) {
            logger.error(`Error creating reputation for worker ${reputationData.worker_id}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Finds a worker's reputation by their ID.
     * @param {string} workerId - The ID of the worker.
     * @returns {Promise<Object|null>} The reputation object if found, otherwise null.
     */
    static async findByWorkerId(workerId) {
        try {
            const { data, error } = await supabase
                .from(TABLE_NAME)
                .select('*')
                .eq('worker_id', workerId)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            return data;
        } catch (error) {
            logger.error(`Error finding reputation for worker ${workerId}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Updates an existing worker's reputation.
     * @param {string} workerId - The ID of the worker to update.
     * @param {Object} updates - The fields to update.
     * @returns {Promise<Object>} The updated reputation object.
     */
    static async update(workerId, updates) {
        try {
            const { data, error } = await supabase
                .from(TABLE_NAME)
                .update(updates)
                .eq('worker_id', workerId)
                .select()
                .single();

            if (error) throw error;
            logger.info(`Reputation for worker ${workerId} updated.`);
            return data;
        } catch (error) {
            logger.error(`Error updating reputation for worker ${workerId}: ${error.message}`);
            throw error;
        }
    }
}

module.exports = ReputationModel;
