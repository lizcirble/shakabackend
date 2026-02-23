import jwt from 'jsonwebtoken';
import { asyncHandler } from '../utils/asyncHandler.js';
import config from '../config/index.js';
import supabase from '../config/supabaseClient.js';
import { logger } from '../utils/logger.js';

/**
 * Optional authentication middleware - attaches user if token is valid, but doesn't block request
 */
const optionalAuth = asyncHandler(async (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        req.user = null;
        req.isAuthenticated = false;
        next();
        return;
    }

    try {
        const decoded = jwt.verify(token, config.jwtSecret);

        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', decoded.userId)
            .single();

        if (error || !user) {
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', decoded.userId)
                .single();

            if (profileError || !profile) {
                req.user = null;
                req.isAuthenticated = false;
                next();
                return;
            }

            req.user = {
                ...profile,
                privy_did: profile.auth_id,
                source_table: 'profiles',
            };
            req.isAuthenticated = true;
            next();
            return;
        }

        req.user = user;
        req.isAuthenticated = true;
        next();
    } catch (error) {
        logger.warn(`Optional auth failed: ${error.message}`);
        req.user = null;
        req.isAuthenticated = false;
        next();
    }
});

export { optionalAuth };
