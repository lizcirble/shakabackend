import config from '../config/index.js';
import { logger } from '../utils/logger.js';
import redis from '../config/upstashRedis.js';
import { addTaskExpirationJob as initTaskExpiration } from './taskExpirationJob.js';

let isRedisConfigured = false;

const checkRedisConnection = async () => {
    if (config.redis.url && config.redis.token) {
        try {
            await redis.ping();
            isRedisConfigured = true;
            logger.info('Upstash Redis connected successfully.');
        } catch (error) {
            logger.warn('Redis not available. Background jobs disabled.');
            isRedisConfigured = false;
        }
    } else {
        logger.warn('Redis credentials not configured. Background jobs disabled.');
        isRedisConfigured = false;
    }
};

const addReputationAnchoringJob = async () => {
    await checkRedisConnection();
    if (!isRedisConfigured) {
        logger.warn('Redis not configured. Reputation anchoring job disabled.');
        return;
    }
    logger.info('Reputation anchoring job initialized with Upstash Redis.');
};

const addTaskExpirationJob = async () => {
    try {
        await initTaskExpiration();
        logger.info('Task expiration job initialized successfully.');
    } catch (error) {
        logger.error(`Failed to initialize task expiration job: ${error.message}`);
    }
};

export { addReputationAnchoringJob, addTaskExpirationJob };
