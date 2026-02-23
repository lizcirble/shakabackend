import rateLimit from 'express-rate-limit';
import { logger } from '../utils/logger.js';

// Strict rate limiting for anonymous task creation
const anonymousTaskLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 tasks per hour per IP
    message: 'Too many tasks created from this IP. Please authenticate or try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Skip rate limiting for authenticated users
        return req.isAuthenticated === true;
    },
    handler: (req, res) => {
        logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            success: false,
            message: 'Too many tasks created. Please authenticate for higher limits.',
        });
    },
});

// General API rate limiter
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per 15 minutes
    standardHeaders: true,
    legacyHeaders: false,
});

export { anonymousTaskLimiter, apiLimiter };
