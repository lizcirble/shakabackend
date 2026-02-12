import { app } from './app.js';
import { logger } from './utils/logger.js';
import dotenv from 'dotenv';
import { addReputationAnchoringJob } from './jobs/reputationAnchoringJob.js';
import { addTaskExpirationJob } from './jobs/taskExpirationJob.js';

dotenv.config();

const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, () => {
    logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    // Initialize background jobs
    addReputationAnchoringJob();
    addTaskExpirationJob();
});

process.on('unhandledRejection', (err) => {
    logger.error('UNHANDLED REJECTION! 💥 Shutting down...');
    logger.error(err.name, err.message);
    server.close(() => {
        process.exit(1);
    });
});

process.on('SIGTERM', () => {
    logger.info('SIGTERM RECEIVED. Shutting down gracefully');
    server.close(() => {
        logger.info('Process terminated!');
    });
});
