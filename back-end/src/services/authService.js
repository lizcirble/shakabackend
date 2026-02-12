import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import privyClient from '../config/privyClient.js';
import supabase from '../config/supabaseClient.js';
import { ApiError } from '../utils/apiError.js';
import { logger } from '../utils/logger.js';
import config from '../config/index.js';

/**
 * Verifies the Privy access token and retrieves the user's Privy data.
 * @param {string} privyAccessToken - The access token from the client.
 * @returns {Promise<object>} The verified user data from Privy.
 */
const verifyPrivyToken = async (privyAccessToken) => {
    try {
        const verifiedUser = await privyClient.verifyAuthToken(privyAccessToken);
        return verifiedUser;
    } catch (error) {
        logger.error(`Privy token verification failed: ${error.message}`);
        throw new ApiError(401, 'Invalid Privy access token.');
    }
};

/**
 * Finds an existing user in Supabase by their Privy DID.
 * @param {string} privyDid - The user's Decentralized Identifier from Privy.
 * @returns {Promise<object|null>} The user object or null if not found.
 */
const findUserByPrivyDid = async (privyDid) => {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('privy_did', privyDid)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = 'No rows found'
        throw new ApiError(500, 'Failed to query user from database.');
    }
    return data;
};

/**
 * Creates a new user in the Supabase database.
 * @param {object} privyUser - The user object from Privy.
 * @returns {Promise<object>} The newly created user object.
 */
const createNewUser = async (privyUser) => {
    const newUser = {
        id: uuidv4(),
        privy_did: privyUser.userId,
        // Additional fields can be populated from privyUser if needed
        // e.g., email: privyUser.email?.address
    };

    const { data, error } = await supabase
        .from('users')
        .insert(newUser)
        .select()
        .single();

    if (error) {
        logger.error(`Failed to create new user: ${error.message}`);
        throw new ApiError(500, 'Failed to create user in database.');
    }
    return data;
};

/**
 * Generates a local JWT for the user to access the backend API.
 * @param {object} user - The user object from the database.
 * @returns {string} The generated JSON Web Token.
 */
const generateLocalJWT = (user) => {
    const payload = {
        userId: user.id,
        privyDid: user.privy_did,
        // Add any other roles or permissions here
    };

    const token = jwt.sign(payload, config.jwtSecret, {
        expiresIn: '7d', // Token expires in 7 days
    });

    return token;
};

export const authService = {
    verifyPrivyToken,
    findUserByPrivyDid,
    createNewUser,
    generateLocalJWT,
};