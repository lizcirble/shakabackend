/**
 * @file utils/deviceFingerprint.js
 * @description Provides utilities for handling and generating device fingerprints.
 * This is a simplified representation. In a real-world scenario, device fingerprinting
 * is complex and often involves client-side libraries and more sophisticated server-side
 * analysis to generate a robust and unique identifier.
 */

/**
 * Generates a simplified device fingerprint.
 * In a production environment, this would involve hashing multiple client-side
 * attributes (e.g., user agent, screen resolution, plugins, fonts, IP address, etc.)
 * and potentially combining with server-side information.
 *
 * For this backend, we'll assume the client provides a fingerprint string.
 * This utility will primarily focus on validating and normalizing it.
 *
 * @param {string} rawFingerprint - The raw device fingerprint string received from the client.
 * @returns {string} A normalized and potentially hashed device fingerprint.
 */
const normalizeFingerprint = (rawFingerprint) => {
    if (!rawFingerprint || typeof rawFingerprint !== 'string') {
        return 'unknown_fingerprint';
    }
    // In a real scenario, you might hash this for storage and comparison
    // e.g., crypto.createHash('sha256').update(rawFingerprint).digest('hex');
    return rawFingerprint.trim().toLowerCase();
};

/**
 * Checks if a device fingerprint is potentially a duplicate based on some criteria.
 * This is a placeholder for more advanced sybil detection logic.
 * @param {string} fingerprint - The device fingerprint to check.
 * @param {Array<string>} existingFingerprints - A list of known fingerprints.
 * @returns {boolean} True if considered a duplicate, false otherwise.
 */
const isDuplicateFingerprint = (fingerprint, existingFingerprints) => {
    // This is a very basic check. Real sybil detection is much more complex.
    return existingFingerprints.includes(fingerprint);
};

module.exports = {
    normalizeFingerprint,
    isDuplicateFingerprint,
};
