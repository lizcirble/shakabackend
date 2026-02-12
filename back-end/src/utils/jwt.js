const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config');
const logger = require('./logger');

/**
 * @file utils/jwt.js
 * @description Provides utilities for generating and verifying JSON Web Tokens (JWTs).
 */

/**
 * Generates a JWT for a given user.
 * @param {Object} user - The user object containing necessary information (e.g., id, privyId).
 * @returns {string} The generated JWT.
 */
const generateToken = (user) => {
    const payload = {
        id: user.id,
        privyId: user.privyId,
        // Add other relevant user data to the token payload
    };
    return jwt.sign(payload, jwtSecret, { expiresIn: '1h' }); // Token expires in 1 hour
};

/**
 * Verifies a given JWT.
 * @param {string} token - The JWT to verify.
 * @returns {Object} The decoded token payload if valid.
 * @throws {Error} If the token is invalid or expired.
 */
const verifyToken = (token) => {
    try {
        return jwt.verify(token, jwtSecret);
    } catch (error) {
        logger.error(`JWT verification failed: ${error.message}`);
        throw new Error('Invalid or expired token');
    }
};

module.exports = {
    generateToken,
    verifyToken,
};
