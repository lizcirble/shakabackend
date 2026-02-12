import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import config from '../config/index.js';
import { logger } from '../utils/logger.js';
import { reputationService } from '../services/reputationService.js';

const connection = config.redis.host ? new IORedis({
    host: config.redis.host,
    port: config.redis.port || 6379,
    maxRetriesPerRequest: null,
}) : null;

const reputationQueue = connection ? new Queue('reputationQueue', { connection }) : null;

const addReputationAnchoringJob = async () => {
    if (!reputationQueue) {
        logger.warn('Redis not configured. Reputation anchoring job disabled.');
        return;
    }
    await reputationQueue.add('anchorReputation', {}, {
        repeat: { cron: '0 0 * * 0' },
        jobId: 'weekly-reputation-anchor',
    });
    logger.info('Added weekly reputation anchoring job.');
};

const reputationWorker = connection ? new Worker('reputationQueue', async (job) => {
    logger.info(`Processing reputation anchoring job: ${job.id}`);
    try {
        await reputationService.anchorReputationOnChain();
        logger.info(`Reputation anchoring job ${job.id} completed successfully.`);
    } catch (error) {
        logger.error(`Reputation anchoring job ${job.id} failed: ${error.message}`);
        throw error;
    }
}, { connection }) : null;

if (reputationWorker) {
    reputationWorker.on('completed', job => {
        logger.debug(`Reputation Job ${job.id} completed.`);
    });

    reputationWorker.on('failed', (job, err) => {
        logger.error(`Reputation Job ${job.id} failed with error: ${err.message}`);
    });
}

export { addReputationAnchoringJob };
