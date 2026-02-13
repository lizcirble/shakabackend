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
        .limit(1);

    if (error) {
        // Fallback for deployments that use `profiles.auth_id` instead of `users.privy_did`.
        logger.warn(`users lookup failed for ${privyDid}, falling back to profiles: ${error.message}`);

        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('auth_id', privyDid)
            .limit(1);

        if (profileError) {
            logger.error(`profiles fallback failed for ${privyDid}: ${profileError.message}`);
            throw new ApiError(500, 'Failed to query user from database.');
        }

        if (!profileData?.[0]) {
            return null;
        }

        return {
            ...profileData[0],
            privy_did: profileData[0].auth_id,
            source_table: 'profiles',
        };
    }
    return data?.[0] || null;
};

/**
 * Creates a new user in the Supabase database.
 * @param {object} privyUser - The user object from Privy.
 * @returns {Promise<object>} The newly created user object.
 */
const createNewUser = async (privyUser) => {
    const walletAddress = privyUser.wallet?.address || null;
    
    const newUser = {
        id: uuidv4(),
        privy_did: privyUser.userId,
        wallet_address: walletAddress,
        // Additional fields can be populated from privyUser if needed
        // e.g., email: privyUser.email?.address
    };

    const { data, error } = await supabase
        .from('users')
        .insert(newUser)
        .select()
        .single();

    if (error) {
        logger.warn(`users insert failed, trying profiles fallback: ${error.message}`);

        const fallbackProfile = {
            id: uuidv4(),
            auth_id: privyUser.userId,
            email: privyUser?.email?.address || null,
            full_name: null,
            avatar_url: null,
            created_at: new Date().toISOString(),
        };

        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .insert(fallbackProfile)
            .select()
            .single();

        if (profileError) {
            logger.error(`Failed to create fallback profile: ${profileError.message}`);
            throw new ApiError(500, 'Failed to create user in database.');
        }

        return {
            ...profileData,
            privy_did: profileData.auth_id,
            source_table: 'profiles',
        };
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
        privyDid: user.privy_did || user.auth_id,
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
