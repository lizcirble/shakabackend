/**
 * @file models/auditLogModel.js
 * @description Defines the structure and basic operations for the 'audit_logs' table in Supabase.
 */

const supabase = require('../config/supabaseClient');
const logger = require('../utils/logger');

const TABLE_NAME = 'audit_logs';

/**
 * Represents an audit log entry in the DataRand system.
 * Corresponds to the 'audit_logs' table in Supabase.
 */
class AuditLogModel {
    /**
     * Creates a new audit log entry.
     * @param {Object} logData - The data for the new log entry.
     * @param {string} logData.user_id - The ID of the user who performed the action.
     * @param {string} logData.action - A description of the action performed.
     * @param {Object} [logData.details] - Additional details about the action.
     * @returns {Promise<Object>} The created audit log object.
     */
    static async create(logData) {
        try {
            const { data, error } = await supabase
                .from(TABLE_NAME)
                .insert([logData])
                .select()
                .single();

            if (error) throw error;
            logger.info(`Audit log created: ${data.action} by user ${data.user_id}`);
            return data;
        } catch (error) {
            logger.error(`Error creating audit log: ${error.message}`);
            throw error;
        }
    }

    /**
     * Finds audit logs by user ID.
     * @param {string} userId - The ID of the user.
     * @returns {Promise<Array<Object>>} An array of audit log objects.
     */
    static async findByUserId(userId) {
        try {
            const { data, error } = await supabase
                .from(TABLE_NAME)
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        } catch (error) {
            logger.error(`Error finding audit logs for user ${userId}: ${error.message}`);
            throw error;
        }
    }
}

module.exports = AuditLogModel;