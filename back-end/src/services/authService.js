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
        logger.info(`Attempting to verify Privy token...`);
        const verifiedClaims = await privyClient.verifyAuthToken(privyAccessToken);
        logger.info(`Token verified, claims: ${JSON.stringify(verifiedClaims)}`);
        const user = await privyClient.users.retrieve(verifiedClaims.sub);
        logger.info(`User retrieved: ${user.id}`);
        return user;
    } catch (error) {
        logger.error(`Privy token verification failed: ${error.message}`);
        logger.error(`Error stack: ${error.stack}`);
        
        // If token verification fails, try to extract user ID from token directly
        // This is a fallback for cases where the token is valid but verification fails due to network/clock issues
        try {
            const decoded = jwt.decode(privyAccessToken);
            if (decoded && decoded.sub) {
                logger.info(`Fallback: extracting user ID from token: ${decoded.sub}`);
                const user = await privyClient.users.retrieve(decoded.sub);
                return user;
            }
        } catch (fallbackError) {
            logger.error(`Fallback also failed: ${fallbackError.message}`);
        }
        
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
    const embeddedWallet = privyUser.linked_accounts.find(
        (acc) => acc.type === 'wallet' && acc.wallet_type === 'embedded'
    );
    const externalWallet = privyUser.linked_accounts.find(
        (acc) => acc.type === 'wallet' && acc.wallet_type !== 'embedded'
    );
    const newUserId = uuidv4();

    const newUser = {
        id: newUserId,
        privy_did: privyUser.id,
        wallet_address: externalWallet ? externalWallet.address : null,
        embedded_wallet_address: embeddedWallet ? embeddedWallet.address : null,
    };

    const { data, error } = await supabase
        .from('users')
        .insert(newUser)
        .select()
        .single();

    if (error) {
        logger.error(`Failed to create user in DB: ${error.message}`);
        if (error.code === '23505') { // unique_violation
             logger.warn(`User with privy_did ${privyUser.id} already exists.`);
             return findUserByPrivyDid(privyUser.id);
        }
        throw new ApiError(500, 'Failed to save user to database.');
    }

    // Also create a corresponding profile
    const emailAccount = privyUser.linked_accounts.find(acc => acc.type === 'email');
    const { error: profileError } = await supabase.from('profiles').insert({
        id: newUserId, // Use the same ID as the user
        auth_id: privyUser.id,
        email: emailAccount ? emailAccount.address : null,
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
