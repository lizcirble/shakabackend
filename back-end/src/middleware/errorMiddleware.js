import { ApiError } from '../utils/apiError.js';
import { logger } from '../utils/logger.js';

const errorMiddleware = (err, req, res, next) => {
    let error = err;

    // If the error is not an instance of our custom ApiError, convert it.
    if (!(error instanceof ApiError)) {
        const statusCode = error.statusCode || 500;
        const message = error.message || 'Internal Server Error';
        error = new ApiError(statusCode, message, error.errors || [], error.stack);
    }

    const response = {
        ...error,
        message: error.message,
        ...(process.env.NODE_ENV === 'development' ? { stack: error.stack } : {}),
    };

    // Log the error
    logger.error(
        `${error.statusCode} - ${error.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`
    );
    if (process.env.NODE_ENV === 'development') {
        logger.error(error.stack);
    }

    // Send the response
    return res.status(error.statusCode).json(response);
};

export { errorMiddleware };
