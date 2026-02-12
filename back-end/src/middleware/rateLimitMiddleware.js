/**
 * @file middleware/rateLimitMiddleware.js
 * @description Middleware for rate limiting requests to prevent abuse.
 * This is a basic in-memory implementation. For production, consider
 * a more robust solution like 'express-rate-limit' with a Redis store.
 */

const rateLimit = {}; // Stores { ip: { count: number, lastReset: Date } }
const WINDOW_SIZE_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS = 100; // Max 100 requests per hour per IP

const rateLimitMiddleware = (req, res, next) => {
    const ip = req.ip; // Or req.headers['x-forwarded-for'] if behind a proxy

    if (!rateLimit[ip]) {
        rateLimit[ip] = {
            count: 0,
            lastReset: Date.now(),
        };
    }

    const currentTime = Date.now();
    if (currentTime - rateLimit[ip].lastReset > WINDOW_SIZE_MS) {
        // Reset window
        rateLimit[ip].count = 0;
        rateLimit[ip].lastReset = currentTime;
    }

    if (rateLimit[ip].count >= MAX_REQUESTS) {
        return res.status(429).json({ message: 'Too many requests, please try again later.' });
    }

    rateLimit[ip].count++;
    next();
};

module.exports = {
    rateLimitMiddleware,
};
