/**
 * @file models/userModel.js
 * @description Defines the structure and basic operations for the 'users' table in Supabase.
 */

const supabase = require('../config/supabaseClient');
const logger = require('../utils/logger');

const TABLE_NAME = 'users';

/**
 * Represents a user in the DataRand system.
 * Corresponds to the 'users' table in Supabase.
 */
class UserModel {
    /**
     * Creates a new user entry in the database.
     * @param {Object} userData - The data for the new user.
     * @param {string} userData.privy_id - The unique ID from Privy.
     * @param {string} userData.wallet_address - The user's primary wallet address.
     * @param {string} [userData.email] - User's email address.
     * @returns {Promise<Object>} The created user object.
     */
    static async create(userData) {
        try {
            const { data, error } = await supabase
                .from(TABLE_NAME)
                .insert([userData])
                .select()
                .single();

            if (error) throw error;
            logger.info(`User created: ${data.privy_id}`);
            return data;
        } catch (error) {
            logger.error(`Error creating user: ${error.message}`);
            throw error;
        }
    }

    /**
     * Finds a user by their Privy ID.
     * @param {string} privyId - The Privy ID of the user.
     * @returns {Promise<Object|null>} The user object if found, otherwise null.
     */
    static async findByPrivyId(privyId) {
        try {
            const { data, error } = await supabase
                .from(TABLE_NAME)
                .select('*')
                .eq('privy_id', privyId)
                .single();

            if (error && error.code !== 'PGRST116') throw error; // PGRST116 means no rows found
            return data;
        } catch (error) {
            logger.error(`Error finding user by Privy ID ${privyId}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Finds a user by their internal database ID.
     * @param {string} id - The internal ID of the user.
     * @returns {Promise<Object|null>} The user object if found, otherwise null.
     */
    static async findById(id) {
        try {
            const { data, error } = await supabase
                .from(TABLE_NAME)
                .select('*')
                .eq('id', id)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            return data;
        } catch (error) {
            logger.error(`Error finding user by ID ${id}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Updates an existing user's information.
     * @param {string} id - The internal ID of the user to update.
     * @param {Object} updates - The fields to update.
     * @returns {Promise<Object>} The updated user object.
     */
    static async update(id, updates) {
        try {
            const { data, error } = await supabase
                .from(TABLE_NAME)
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            logger.info(`User ${id} updated.`);
            return data;
        } catch (error) {
            logger.error(`Error updating user ${id}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Records a device fingerprint for a user.
     * @param {string} userId - The internal ID of the user.
     * @param {string} fingerprint - The device fingerprint string.
     * @returns {Promise<Object>} The updated user object.
     */
    static async addDeviceFingerprint(userId, fingerprint) {
        try {
            const { data: user, error: fetchError } = await supabase
                .from(TABLE_NAME)
                .select('device_fingerprints')
                .eq('id', userId)
                .single();

            if (fetchError) throw fetchError;

            const currentFingerprints = user.device_fingerprints || [];
            if (!currentFingerprints.includes(fingerprint)) {
                const { data, error } = await supabase
                    .from(TABLE_NAME)
                    .update({ device_fingerprints: [...currentFingerprints, fingerprint] })
                    .eq('id', userId)
                    .select()
                    .single();

                if (error) throw error;
                logger.info(`Device fingerprint added for user ${userId}.`);
                return data;
            }
            return user; // Fingerprint already exists
        } catch (error) {
            logger.error(`Error adding device fingerprint for user ${userId}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Retrieves all device fingerprints for a given user.
     * @param {string} userId - The internal ID of the user.
     * @returns {Promise<Array<string>>} An array of device fingerprints.
     */
    static async getDeviceFingerprints(userId) {
        try {
            const { data, error } = await supabase
                .from(TABLE_NAME)
                .select('device_fingerprints')
                .eq('id', userId)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            return data ? data.device_fingerprints || [] : [];
        } catch (error) {
            logger.error(`Error getting device fingerprints for user ${userId}: ${error.message}`);
            throw error;
        }
    }
}

module.exports = UserModel;
