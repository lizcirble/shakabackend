import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import config from '../config/index.js';
import { logger } from '../utils/logger.js';
import supabase from '../config/supabaseClient.js';

const connection = config.redis.host ? new IORedis({
    host: config.redis.host,
    port: config.redis.port || 6379,
    maxRetriesPerRequest: null,
}) : null;

const taskExpirationQueue = connection ? new Queue('taskExpirationQueue', { connection }) : null;

const SUBMISSION_TTL_MINUTES = 5; // Submissions expire after 5 minutes if not completed

/**
 * Adds a job to the task expiration queue.
 */
const addTaskExpirationJob = async () => {
    await taskExpirationQueue.add('checkExpiredSubmissions', {}, {
        repeat: { every: 60000 }, // Run every minute
        jobId: 'hourly-task-expiration-check',
    });
    logger.info('Added periodic task expiration check job.');
};

// Worker for checking and expiring submissions
const taskExpirationWorker = new Worker('taskExpirationQueue', async (job) => {
    logger.info(`Processing task expiration job: ${job.id}`);
    const expirationThreshold = new Date(Date.now() - SUBMISSION_TTL_MINUTES * 60 * 1000).toISOString();

    try {
        const { data: expiredSubmissions, error } = await supabase
            .from('submissions')
            .select('id, task_id, worker_id')
            .eq('status', 'pending')
            .lt('created_at', expirationThreshold); // Assuming created_at marks assignment time

        if (error) {
            logger.error(`Error fetching expired submissions: ${error.message}`);
            throw error;
        }

        if (expiredSubmissions.length > 0) {
            logger.warn(`Found ${expiredSubmissions.length} expired pending submissions.`);

            const expiredSubmissionIds = expiredSubmissions.map(sub => sub.id);

            // Mark submissions as expired
            const { error: updateError } = await supabase
                .from('submissions')
                .update({ status: 'expired', expired_at: new Date() })
                .in('id', expiredSubmissionIds);

            if (updateError) {
                logger.error(`Error updating expired submissions status: ${updateError.message}`);
                throw updateError;
            }

            // For each expired submission, potentially re-add the task to the available pool
            // This might involve updating the task's available worker count or similar logic.
            // For now, we just log it.
            expiredSubmissions.forEach(sub => {
                logger.info(`Submission ${sub.id} for task ${sub.task_id} by worker ${sub.worker_id} expired.`);
                // TODO: Implement logic to make the task available again if needed
            });
        } else {
            logger.info('No expired pending submissions found.');
        }
        logger.info(`Task expiration job ${job.id} completed successfully.`);
    } catch (error) {
        logger.error(`Task expiration job ${job.id} failed: ${error.message}`);
        throw error;
    }
}, { connection });

taskExpirationWorker.on('completed', job => {
    logger.debug(`Task Expiration Job ${job.id} completed.`);
});

taskExpirationWorker.on('failed', (job, err) => {
    logger.error(`Task Expiration Job ${job.id} failed with error: ${err.message}`);
});

export { addTaskExpirationJob };
