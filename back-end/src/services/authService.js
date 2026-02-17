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

    if (error && error.code !== 'PGRST116') { // PGRST116: row not found
        logger.error(`Error finding user by privy DID: ${error.message}`);
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
    const walletAddress = privyUser.wallet?.address || null;
    // NOTE: Assuming the property is `walletType`. It could be `wallet_type`.
    const isEmbeddedWallet = privyUser.wallet?.walletType === 'embedded';
    const newUserId = uuidv4();

    const newUser = {
        id: newUserId,
        privy_did: privyUser.userId,
        wallet_address: !isEmbeddedWallet ? walletAddress : null,
        embedded_wallet_address: isEmbeddedWallet ? walletAddress : null,
    };

    const { data, error } = await supabase
        .from('users')
        .insert(newUser)
        .select()
        .single();

    if (error) {
        logger.error(`Failed to create user in DB: ${error.message}`);
        if (error.code === '23505') { // unique_violation
             logger.warn(`User with privy_did ${privyUser.userId} already exists.`);
             return findUserByPrivyDid(privyUser.userId);
        }
        throw new ApiError(500, 'Failed to save user to database.');
    }

    // Also create a corresponding profile
    const { error: profileError } = await supabase.from('profiles').insert({
        id: newUserId, // Use the same ID as the user
        auth_id: privyUser.userId,
        email: privyUser.email?.address || null,
    });

    if (profileError) {
        logger.warn(`Could not create profile for new user ${data.id}: ${profileError.message}`);
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
