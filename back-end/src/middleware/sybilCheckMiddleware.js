const { isDuplicateFingerprint, normalizeFingerprint } = require('../utils/deviceFingerprint');
const UserModel = require('../models/userModel');
const logger = require('../utils/logger');

/**
 * @file middleware/sybilCheckMiddleware.js
 * @description Middleware for performing sybil checks, primarily based on device fingerprints.
 */

const sybilCheckMiddleware = async (req, res, next) => {
    const { device_fingerprint } = req.body; // Assuming fingerprint is sent in the body for certain requests
    const userId = req.user ? req.user.id : null; // Assuming user is authenticated and attached to req.user

    if (!device_fingerprint) {
        logger.warn('Request missing device fingerprint for sybil check.');
        // Depending on policy, you might want to block or just warn.
        // For now, we'll allow but log a warning.
        return next();
    }

    const normalizedFingerprint = normalizeFingerprint(device_fingerprint);

    if (userId) {
        try {
            const existingFingerprints = await UserModel.getDeviceFingerprints(userId);
            if (isDuplicateFingerprint(normalizedFingerprint, existingFingerprints)) {
                logger.warn(`Sybil alert: User ${userId} submitted a duplicate device fingerprint: ${normalizedFingerprint}`);
                // You might want to:
                // 1. Block the request: return res.status(403).json({ message: 'Sybil detected: Duplicate device fingerprint.' });
                // 2. Flag the user: req.user.isSybilSuspect = true;
                // 3. Reduce task priority: req.taskPriorityModifier = -1;
                // For now, we'll just log and proceed, but a real system would take action.
            }
            // Add the new fingerprint if it's not already associated with the user
            if (!existingFingerprints.includes(normalizedFingerprint)) {
                await UserModel.addDeviceFingerprint(userId, normalizedFingerprint);
            }
        } catch (error) {
            logger.error(`Error during sybil check for user ${userId}: ${error.message}`);
            // Continue processing, but log the error
        }
    } else {
        logger.warn(`Sybil check attempted for unauthenticated request with fingerprint: ${normalizedFingerprint}`);
        // Handle unauthenticated requests if necessary for sybil prevention
    }

    next();
};

module.exports = {
    sybilCheckMiddleware,
};
