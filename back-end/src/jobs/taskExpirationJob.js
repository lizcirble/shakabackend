import { logger } from '../utils/logger.js';
import supabase from '../config/supabaseClient.js';

const SUBMISSION_TTL_MINUTES = 5; // Submissions expire after 5 minutes if not completed
let expirationInterval = null;

/**
 * Check and expire pending submissions
 */
const checkExpiredSubmissions = async () => {
    const expirationThreshold = new Date(Date.now() - SUBMISSION_TTL_MINUTES * 60 * 1000).toISOString();

    try {
        const { data: expiredSubmissions, error } = await supabase
            .from('submissions')
            .select('id, task_id, worker_id')
            .eq('status', 'pending')
            .lt('created_at', expirationThreshold);

        if (error) {
            logger.error(`Error fetching expired submissions: ${error.message}`);
            return;
        }

        if (expiredSubmissions && expiredSubmissions.length > 0) {
            logger.warn(`Found ${expiredSubmissions.length} expired pending submissions.`);

            const expiredSubmissionIds = expiredSubmissions.map(sub => sub.id);

            // Mark submissions as expired
            const { error: updateError } = await supabase
                .from('submissions')
                .update({ status: 'expired', expired_at: new Date().toISOString() })
                .in('id', expiredSubmissionIds);

            if (updateError) {
                logger.error(`Error updating expired submissions: ${updateError.message}`);
                return;
            }

            expiredSubmissions.forEach(sub => {
                logger.info(`Submission ${sub.id} for task ${sub.task_id} by worker ${sub.worker_id} expired.`);
            });
        }
    } catch (error) {
        logger.error(`Task expiration check failed: ${error.message}`);
    }
};

/**
 * Initialize task expiration job
 */
const addTaskExpirationJob = async () => {
    if (expirationInterval) {
        clearInterval(expirationInterval);
    }
    
    // Run immediately
    await checkExpiredSubmissions();
    
    // Run every minute
    expirationInterval = setInterval(checkExpiredSubmissions, 60000);
    logger.info('Task expiration job started (runs every 60 seconds).');
};

export { addTaskExpirationJob };
