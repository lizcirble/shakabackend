/**
 * @file models/escrowModel.js
 * @description Defines the structure and basic operations for the 'escrow_transactions' table in Supabase.
 * This model tracks the state of on-chain escrow transactions within the Supabase backend.
 */

const supabase = require('../config/supabaseClient');
const logger = require('../utils/logger');

const TABLE_NAME = 'escrow_transactions';

/**
 * Represents an escrow transaction in the DataRand system.
 * Corresponds to the 'escrow_transactions' table in Supabase.
 */
class EscrowModel {
    /**
     * Creates a new escrow transaction entry in the database.
     * @param {Object} transactionData - The data for the new transaction.
     * @param {string} transactionData.task_id - The ID of the associated task.
     * @param {string} transactionData.transaction_hash - The blockchain transaction hash.
     * @param {string} transactionData.type - Type of transaction (e.g., 'fund', 'payout', 'refund', 'platform_fee').
     * @param {string} transactionData.status - Current status (e.g., 'pending', 'completed', 'failed').
     * @param {string} transactionData.from_address - The sender's blockchain address.
     * @param {string} transactionData.to_address - The recipient's blockchain address.
     * @param {number} transactionData.amount - The amount of the transaction.
     * @returns {Promise<Object>} The created escrow transaction object.
     */
    static async create(transactionData) {
        try {
            const { data, error } = await supabase
                .from(TABLE_NAME)
                .insert([transactionData])
                .select()
                .single();

            if (error) throw error;
            logger.info(`Escrow transaction created: ${data.id} for task ${data.task_id}`);
            return data;
        } catch (error) {
            logger.error(`Error creating escrow transaction for task ${transactionData.task_id}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Finds an escrow transaction by its ID.
     * @param {string} transactionId - The ID of the transaction.
     * @returns {Promise<Object|null>} The transaction object if found, otherwise null.
     */
    static async findById(transactionId) {
        try {
            const { data, error } = await supabase
                .from(TABLE_NAME)
                .select('*')
                .eq('id', transactionId)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            return data;
        } catch (error) {
            logger.error(`Error finding escrow transaction by ID ${transactionId}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Finds escrow transactions for a given task.
     * @param {string} taskId - The ID of the task.
     * @returns {Promise<Array<Object>>} An array of escrow transaction objects.
     */
    static async findByTaskId(taskId) {
        try {
            const { data, error } = await supabase
                .from(TABLE_NAME)
                .select('*')
                .eq('task_id', taskId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        } catch (error) {
            logger.error(`Error finding escrow transactions for task ${taskId}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Updates an existing escrow transaction's information.
     * @param {string} transactionId - The ID of the transaction to update.
     * @param {Object} updates - The fields to update.
     * @returns {Promise<Object>} The updated transaction object.
     */
    static async update(transactionId, updates) {
        try {
            const { data, error } = await supabase
                .from(TABLE_NAME)
                .update(updates)
                .eq('id', transactionId)
                .select()
                .single();

            if (error) throw error;
            logger.info(`Escrow transaction ${transactionId} updated.`);
            return data;
        } catch (error) {
            logger.error(`Error updating escrow transaction ${transactionId}: ${error.message}`);
            throw error;
        }
    }
}

module.exports = EscrowModel;
