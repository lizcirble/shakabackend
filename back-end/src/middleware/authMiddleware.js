import jwt from 'jsonwebtoken';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import config from '../config/index.js';
import supabase from '../config/supabaseClient.js';

const authMiddleware = asyncHandler(async (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        throw new ApiError(401, 'Unauthorized. No token provided.');
    }

    try {
        const decoded = jwt.verify(token, config.jwtSecret);

        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', decoded.userId)
            .single();

        if (error || !user) {
            throw new ApiError(401, 'Unauthorized. User not found.');
        }

        req.user = user;
        next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            throw new ApiError(401, 'Unauthorized. Invalid token.');
        }
        throw error;
    }
});

export { authMiddleware };