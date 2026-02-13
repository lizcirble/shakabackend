import { authService } from '../services/authService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { logger } from '../utils/logger.js';
import supabase from '../config/supabaseClient.js';

const loginOrRegister = asyncHandler(async (req, res) => {
    const { privyAccessToken, deviceFingerprint } = req.body;

    if (!privyAccessToken) {
        throw new ApiError(400, 'Privy access token is required.');
    }
    if (!deviceFingerprint) {
        throw new ApiError(400, 'Device fingerprint is required.');
    }

    // 1. Verify the token with Privy
    const privyUser = await authService.verifyPrivyToken(privyAccessToken);

    // 2. Find or create the user in our database
    let user = await authService.findUserByPrivyDid(privyUser.userId);
    if (!user) {
        user = await authService.createNewUser(privyUser);
        logger.info(`New user created with Privy DID: ${user.privy_did}`);
    }

    // 3. Update device fingerprint
    // This is a simplified implementation. A real-world scenario would involve
    // more complex logic to handle multiple devices and prevent Sybil attacks.
    const targetTable = user.source_table === 'profiles' ? 'profiles' : 'users';
    const updatePayload = targetTable === 'profiles'
        ? { updated_at: new Date().toISOString() }
        : { last_fingerprint: deviceFingerprint, last_login_at: new Date() };

    const { error: updateError } = await supabase
        .from(targetTable)
        .update(updatePayload)
        .eq('id', user.id);

    if (updateError) {
        logger.error(`Failed to update login metadata on ${targetTable}: ${updateError.message}`);
        // Non-critical error, so we only log it and continue.
    }

    // 4. Generate a local JWT for our API
    const localToken = authService.generateLocalJWT(user);

    res.status(200).json({
        success: true,
        message: 'Login successful',
        token: localToken,
        user: {
            id: user.id,
            privyDid: user.privy_did,
        },
    });
});

export const authController = {
    loginOrRegister,
};
