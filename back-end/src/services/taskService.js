import { ethers } from 'ethers';
import supabase from '../config/supabaseClient.js';
import { ApiError } from '../utils/apiError.js';
import { logger } from '../utils/logger.js';
import { escrowService } from './escrowService.js';
import { wsaService } from './wsaService.js'; // Import wsaService

const PLATFORM_FEE_PERCENTAGE = 15; // 15%

// A simple keyword scanner for harmful content.
// In a real application, this would be a more sophisticated service.
const FORBIDDEN_KEYWORDS = ['hack', 'illegal', 'malicious', 'attack'];

// Thresholds for task splitting and WSA offloading (example values)
const LARGE_TASK_WORKER_THRESHOLD = 50;
const COMPLEX_TASK_CATEGORIES = ['AI Evaluation'];

/**
 * Resolves a profile ID from an authenticated actor ID.
 * Supports both deployments where auth maps to `users.id` and `profiles.id`.
 * @param {string} actorId
 * @returns {Promise<string|null>}
 */
const resolveProfileId = async (actorId) => {
    const { data: profileById } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', actorId)
        .maybeSingle();

    if (profileById?.id) {
        return profileById.id;
    }

    const { data: userById } = await supabase
        .from('users')
        .select('privy_did')
        .eq('id', actorId)
        .maybeSingle();

    if (!userById?.privy_did) {
        return null;
    }

    const { data: profileByAuthId } = await supabase
        .from('profiles')
        .select('id')
        .eq('auth_id', userById.privy_did)
        .maybeSingle();

    if (profileByAuthId?.id) {
        return profileByAuthId.id;
    }

    // Backfill profile row for deployments where users exist without profiles.
    const { data: createdProfile, error: createProfileError } = await supabase
        .from('profiles')
        .insert({ auth_id: userById.privy_did })
        .select('id')
        .single();

    if (!createProfileError && createdProfile?.id) {
        return createdProfile.id;
    }

    // Handle potential race condition (another request created it first).
    const { data: profileAfterRace } = await supabase
        .from('profiles')
        .select('id')
        .eq('auth_id', userById.privy_did)
        .maybeSingle();

    return profileAfterRace?.id || null;
};

/**
 * Resolves creator context for task creation.
 * @param {string} actorId
 * @returns {Promise<{ profileId: string | null, walletAddress: string | null, isFirstTask: boolean }>}
 */
const resolveCreatorContext = async (actorId) => {
    const profileId = await resolveProfileId(actorId);

    const { data: userById } = await supabase
        .from('users')
        .select('wallet_address, is_first_task, privy_did')
        .eq('id', actorId)
        .maybeSingle();

    if (userById) {
        return {
            profileId,
            walletAddress: userById.wallet_address || null,
            isFirstTask: Boolean(userById.is_first_task),
        };
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('auth_id')
        .eq('id', actorId)
        .maybeSingle();

    if (!profile?.auth_id) {
        return { profileId, walletAddress: null, isFirstTask: false };
    }

    const { data: userByAuthId } = await supabase
        .from('users')
        .select('wallet_address, is_first_task')
        .eq('privy_did', profile.auth_id)
        .maybeSingle();

    return {
        profileId,
        walletAddress: userByAuthId?.wallet_address || null,
        isFirstTask: Boolean(userByAuthId?.is_first_task),
    };
};

/**
 * Resolves wallet address for a profile ID.
 * @param {string} profileId
 * @returns {Promise<string|null>}
 */
const getWalletAddressForProfile = async (profileId) => {
    const { data: profile } = await supabase
        .from('profiles')
        .select('auth_id')
        .eq('id', profileId)
        .maybeSingle();

    if (!profile?.auth_id) {
        return null;
    }

    const { data: user } = await supabase
        .from('users')
        .select('wallet_address, embedded_wallet_address')
        .eq('privy_did', profile.auth_id)
        .maybeSingle();

    return user?.embedded_wallet_address || user?.wallet_address || null;
};

/**
 * Validates task input data.
 * @param {object} taskData - The data for the new task.
 * @param {object} creator - The user object of the creator.
 */
const validateTaskInput = (taskData, creator) => {
    const { title, description, category, payoutPerWorker, requiredWorkers } = taskData;
    if (!title || !description || !category || !payoutPerWorker || !requiredWorkers) {
        throw new ApiError(400, 'Missing required task fields.');
    }

    if (requiredWorkers < 1) {
        throw new ApiError(400, 'At least one worker is required.');
    }

    // First-time creator caps - only if the column exists
    if (creator.is_first_task === true || creator.is_first_task === 'true') {
        if (requiredWorkers > 10) {
            throw new ApiError(400, 'First-time creators are limited to 10 workers.');
        }
        const maxPayout = ethers.parseEther('0.1'); // e.g., 0.1 ETH
        if (ethers.parseEther(payoutPerWorker.toString()) > maxPayout) {
            throw new ApiError(400, `First-time creators are limited to a payout of ${ethers.formatEther(maxPayout)} ETH per worker.`);
        }
    }

    // Keyword scan
    const combinedText = `${title} ${description}`.toLowerCase();
    if (FORBIDDEN_KEYWORDS.some(keyword => combinedText.includes(keyword))) {
        throw new ApiError(400, 'Task contains potentially harmful content and cannot be created.');
    }
};

/**
 * Helper function to split a large task into sub-tasks and offload to WSA.
 * @param {object} task - The task object to split.
 * @returns {Promise<void>}
 */
const splitAndOffloadToWSA = async (task) => {
    const isLargeTask = task.worker_count > LARGE_TASK_WORKER_THRESHOLD;
    const isComplexTask = COMPLEX_TASK_CATEGORIES.includes(task.task_type_id);

    if (isLargeTask || isComplexTask) {
        logger.info(`Task ${task.id} identified as large/complex. Splitting and offloading to WSA.`);
        // In a real scenario, this would involve actual task splitting logic
        // and creating multiple sub-tasks in the database.
        const subTaskData = {
            taskId: task.id,
            taskType: task.category,
            inputData: task.description, // Example: sending description as input
            // ... other relevant task data for WSA
        };
        try {
            const wsaJob = await wsaService.submitSubTaskToWSA(subTaskData);
            // Store WSA job ID in the task or a dedicated table for tracking
            await supabase.from('tasks').update({ wsa_job_id: wsaJob.jobId, status: 'WSA_PROCESSING' }).eq('id', task.id);
            logger.info(`Task ${task.id} offloaded to WSA with job ID: ${wsaJob.jobId}`);
        } catch (error) {
            logger.error(`Failed to offload task ${task.id} to WSA: ${error.message}`);
            // Depending on policy, might revert task creation or mark for manual review
        }
    }
};

/**
 * Creates a new task as a DRAFT in the database and on-chain.
 * @param {object} taskData - The data for the new task from the request.
 * @param {string|null} creatorId - The ID of the user creating the task (null for anonymous).
 * @returns {Promise<object>} The newly created task object.
 */
const createTask = async (taskData, creatorId) => {
    let creatorContext = null;
    
    // Handle authenticated users
    if (creatorId) {
        creatorContext = await resolveCreatorContext(creatorId);
        if (!creatorContext.profileId) {
            throw new ApiError(404, 'Task creator profile not found.');
        }
        validateTaskInput(taskData, { is_first_task: creatorContext.isFirstTask });
    } else {
        // Anonymous user - apply stricter validation
        validateTaskInput(taskData, { is_first_task: true }); // Treat as first-time user
        
        // Additional anonymous user restrictions
        if (taskData.requiredWorkers > 5) {
            throw new ApiError(400, 'Anonymous users are limited to 5 workers.');
        }
    }

    logger.info(`Creating task with data: ${JSON.stringify(taskData, null, 2)}`);

    const { title, description, category, payoutPerWorker, requiredWorkers, deadline } = taskData;

    let expiresAt = null;
    if (deadline) {
        const parsedDate = new Date(deadline);
        if (!isNaN(parsedDate.getTime())) {
            expiresAt = parsedDate.toISOString();
        } else {
            logger.warn(`Invalid deadline format received: ${deadline}. Setting expires_at to null.`);
        }
    }

    let payoutInWei;
    try {
        payoutInWei = ethers.parseEther(payoutPerWorker.toString());
    } catch (e) {
        throw new ApiError(400, `Invalid payout amount: ${payoutPerWorker}. Must be a valid number.`);
    }

    const categorySlug = category.toLowerCase().replace(/ /g, '_');
    const { data: taskType } = await supabase
        .from('task_types')
        .select('id')
        .ilike('name', categorySlug)
        .single();

    const subtotal = payoutInWei * BigInt(requiredWorkers);
    const platformFee = (subtotal * BigInt(PLATFORM_FEE_PERCENTAGE)) / 100n;
    const totalCost = subtotal + platformFee;

    const newTask = {
        title,
        description,
        client_id: creatorContext?.profileId || null, // null for anonymous
        task_type_id: taskType?.id || null,
        payout_amount: payoutInWei.toString(),
        worker_count: requiredWorkers,
        status: 'DRAFT',
        expires_at: expiresAt,
        is_anonymous: !creatorId, // Flag anonymous tasks
    };

    const { data: createdTask, error: insertError } = await supabase
        .from('tasks')
        .insert(newTask)
        .select()
        .single();

    if (insertError) {
        logger.error(`Failed to create task in DB: ${JSON.stringify(insertError)}`);
        throw new ApiError(500, `Failed to save task to database: ${insertError.message}`);
    }

    // Only try on-chain creation for authenticated users with wallets
    if (creatorContext?.walletAddress) {
        try {
            await escrowService.createTaskOnChain(
                createdTask.id,
                creatorContext.walletAddress,
                payoutInWei.toString(),
                requiredWorkers
            );
        } catch (chainError) {
            logger.warn(`On-chain task creation skipped: ${chainError.message}`);
        }
    } else {
        logger.info(`Skipping on-chain task creation for ${creatorId ? 'authenticated user without wallet' : 'anonymous user'}`);
    }

    // Check if the task needs to be split and offloaded to WSA
    await splitAndOffloadToWSA(createdTask);

    return { 
        ...createdTask, 
        total_cost_eth: ethers.formatEther(totalCost),
        requires_auth: !creatorId,
    };
};

/**
 * Funds a task by preparing transaction data for the user to sign.
 * @param {number} taskId - The ID of the task to fund.
 * @param {string} userId - The ID of the user attempting to fund the task.
 * @returns {Promise<object>} Transaction data for the frontend to sign.
 */
const fundTask = async (taskId, userId) => {
    console.log('fundTask called with taskId:', taskId, 'userId:', userId);
    
    const requesterProfileId = await resolveProfileId(userId);
    if (!requesterProfileId) {
        throw new ApiError(404, 'Requesting user profile not found.');
    }

    console.log('Looking for task with id:', taskId, 'type:', typeof taskId);
    
    const { data: task, error: taskError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();

    console.log('Task query result:', { task, taskError });

    if (taskError || !task) {
        console.error('Task not found. Error:', taskError);
        throw new ApiError(404, 'Task not found.');
    }

    if (task.client_id !== requesterProfileId) {
        throw new ApiError(403, 'Only the task creator can fund this task.');
    }

    console.log('Task status:', task.status);
    
    if (!['DRAFT', 'FUNDED'].includes(task.status)) {
        throw new ApiError(400, `Task cannot be funded. Status is: ${task.status}`);
    }

    // If already funded, check if it's available on-chain
    if (task.status === 'FUNDED') {
        const isFunded = await escrowService.verifyTaskFunding(taskId);
        if (isFunded) {
            // Already funded on-chain, just update to available
            const { data: updatedTask } = await supabase
                .from('tasks')
                .update({ status: 'available' })
                .eq('id', taskId)
                .select()
                .single();
            return updatedTask;
        }
        // Not funded on-chain, allow retry
    }

    // Get creator wallet address for transaction preparation
    let creatorWalletAddress = await getWalletAddressForProfile(task.client_id);
    
    // If no wallet found, try to get from users table directly using auth_id
    if (!creatorWalletAddress) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('auth_id')
            .eq('id', task.client_id)
            .maybeSingle();
        
        if (profile?.auth_id) {
            const { data: user } = await supabase
                .from('users')
                .select('wallet_address, embedded_wallet_address')
                .eq('privy_did', profile.auth_id)
                .maybeSingle();
            
            creatorWalletAddress = user?.embedded_wallet_address || user?.wallet_address;
        }
    }
    
    if (!creatorWalletAddress) {
        throw new ApiError(400, 'No wallet address found. Please connect your wallet or create an embedded wallet first.');
    }

    // Calculate total cost including platform fee
    const subtotal = BigInt(task.payout_amount) * BigInt(task.worker_count);
    const platformFee = (subtotal * BigInt(PLATFORM_FEE_PERCENTAGE)) / 100n;
    const totalCost = subtotal + platformFee;

    // Prepare transaction data for the frontend
    const txData = await escrowService.fundTaskOnChain(
        task.id,
        creatorWalletAddress,
        totalCost.toString()
    );

    logger.info(`Transaction data prepared for task ${taskId} funding`);
    
    return {
        task,
        txData: txData.txData,
        totalCost: totalCost.toString(),
        totalCostEth: ethers.formatEther(totalCost)
    };
};

/**
 * Confirms task funding after user has signed the transaction.
 * @param {number} taskId - The ID of the task.
 * @param {string} userId - The ID of the user.
 * @param {string} txHash - The transaction hash.
 * @returns {Promise<object>} The updated task.
 */
const confirmTaskFunding = async (taskId, userId, txHash) => {
    const requesterProfileId = await resolveProfileId(userId);
    if (!requesterProfileId) {
        throw new ApiError(404, 'Requesting user profile not found.');
    }

    const { data: task, error: taskError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();

    if (taskError || !task) {
        throw new ApiError(404, 'Task not found.');
    }

    if (task.client_id !== requesterProfileId) {
        throw new ApiError(403, 'Only the task creator can confirm funding.');
    }

    // Verify the transaction on-chain
    const isFunded = await escrowService.verifyTaskFunding(taskId);
    
    if (!isFunded) {
        throw new ApiError(400, 'Task funding not confirmed on-chain. Please wait for transaction confirmation.');
    }

    // Update task status to FUNDED
    const { data: updatedTask, error: updateError } = await supabase
        .from('tasks')
        .update({ 
            status: 'available',  // Make task available to workers
            funding_tx_hash: txHash 
        })
        .eq('id', taskId)
        .select()
        .single();

    if (updateError) {
        logger.error(`Failed to update task status to FUNDED for task ${taskId}: ${updateError.message}`);
        throw new ApiError(500, 'Failed to update task status in database.');
    }

    logger.info(`Task ${taskId} successfully funded and confirmed. TX: ${txHash}`);
    return updatedTask;
};

/**
 * Finds and assigns an available task to a worker.
 * @param {string} workerId - The ID of the user requesting a task.
 * @returns {Promise<object>} The assigned task and submission details.
 */
const assignTaskToWorker = async (workerId) => {
    const { data: worker, error: workerError } = await supabase
        .from('users')
        .select('id, wallet_address')
        .eq('id', workerId)
        .single();

    if (workerError || !worker) {
        throw new ApiError(404, 'Worker not found.');
    }

    // Find a task that is funded, not created by the worker, and has open slots.
    // This is a simplified query. A real system would use a more complex matching algorithm
    // based on reputation, worker skills, etc. and would need to handle concurrency.
    const { data: availableTask, error: taskError } = await supabase.rpc('find_available_task', {
        requesting_worker_id: workerId
    }).single();
    
    if (taskError || !availableTask) {
        throw new ApiError(404, 'No available tasks at the moment.');
    }

    // Create a submission record to represent the "reservation" of the task.
    // The TTL logic would be implemented here (e.g., with a scheduled job).
    const { data: submission, error: submissionError } = await supabase
        .from('submissions')
        .insert({
            task_id: availableTask.id,
            worker_id: workerId,
            status: 'pending', // This worker is now working on the task
        })
        .select()
        .single();

    if (submissionError) {
        logger.error(`Failed to create submission: ${submissionError.message}`);
        throw new ApiError(500, 'Failed to reserve task for worker.');
    }

    // Assign the worker on-chain
    await escrowService.assignWorkersOnChain(availableTask.id, [worker.wallet_address]);

    logger.info(`Task ${availableTask.id} assigned to worker ${workerId}. Submission ID: ${submission.id}`);

    return { task: availableTask, submission };
};

const getTaskById = async (taskId) => {
    const { data: task, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();

    if (error || !task) {
        throw new ApiError(404, 'Task not found.');
    }

    return task;
};

const getTasksByCreator = async (creatorId) => {
    const creatorProfileId = await resolveProfileId(creatorId);
    if (!creatorProfileId) {
        return [];
    }

    const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('client_id', creatorProfileId)
        .order('created_at', { ascending: false });

    if (error) {
        throw new ApiError(500, 'Failed to fetch tasks.');
    }

    return tasks || [];
};

const getAvailableTasks = async () => {
    const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*')
        .in('status', ['available', 'FUNDED'])
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) {
        throw new ApiError(500, 'Failed to fetch available tasks.');
    }

    return tasks || [];
};

const getAssignedTasks = async (workerId) => {
    const { data: submissions, error } = await supabase
        .from('submissions')
        .select('*, task:tasks(*)')
        .eq('worker_id', workerId)
        .order('created_at', { ascending: false });

    if (error) {
        throw new ApiError(500, 'Failed to fetch assigned tasks.');
    }

    return submissions || [];
};

export const taskService = {
    createTask,
    fundTask,
    confirmTaskFunding,
    assignTaskToWorker,
    getTaskById,
    getTasksByCreator,
    getAvailableTasks,
    getAssignedTasks,
};
