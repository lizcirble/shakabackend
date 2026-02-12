import { ethers } from 'ethers';
import { escrowContract, wallet } from '../config/blockchainClient.js';
import { logger } from '../utils/logger.js';
import { ApiError } from '../utils/apiError.js';

const TASK_STATUS = {
    Created: 0,
    Funded: 1,
    Completed: 2,
    Cancelled: 3
};

const createTaskOnChain = async (taskId, creatorAddress, payoutPerWorker, requiredWorkers) => {
    try {
        logger.info(`Creating task ${taskId} on-chain...`);
        const tx = await escrowContract.createTask(
            taskId,
            creatorAddress,
            payoutPerWorker,
            requiredWorkers
        );
        const receipt = await tx.wait();

        if (!receipt.status) {
            throw new Error('Transaction reverted on-chain');
        }

        logger.info(`Task ${taskId} created on-chain. Transaction: ${tx.hash}`);
        return { hash: tx.hash, blockNumber: receipt.blockNumber };
    } catch (error) {
        logger.error(`Failed to create task ${taskId} on-chain: ${error.message}`);
        throw new ApiError(500, 'Blockchain transaction failed during task creation.');
    }
};

const fundTaskOnChain = async (taskId, creatorAddress, totalAmountInWei) => {
    try {
        logger.info(`Funding task ${taskId} with ${ethers.formatEther(totalAmountInWei)} ETH...`);

        const tx = await escrowContract.fundTask(taskId, {
            value: totalAmountInWei
        });

        const receipt = await tx.wait();

        if (!receipt.status) {
            throw new Error('Transaction reverted on-chain');
        }

        const onChainStatus = await escrowContract.getTaskStatus(taskId);
        if (onChainStatus !== TASK_STATUS.Funded) {
            logger.error(`On-chain status mismatch after funding: expected Funded (1), got ${onChainStatus}`);
            throw new ApiError(500, 'On-chain task status mismatch after funding');
        }

        logger.info(`Task ${taskId} funded successfully. Transaction: ${tx.hash}`);
        return { hash: tx.hash, blockNumber: receipt.blockNumber };
    } catch (error) {
        logger.error(`Failed to fund task ${taskId} on-chain: ${error.message}`);
        throw new ApiError(500, 'Blockchain transaction failed during task funding.');
    }
};

const assignWorkersOnChain = async (taskId, workerAddresses) => {
    try {
        logger.info(`Assigning ${workerAddresses.length} workers to task ${taskId} on-chain...`);
        const tx = await escrowContract.assignWorkers(taskId, workerAddresses);
        const receipt = await tx.wait();

        if (!receipt.status) {
            throw new Error('Transaction reverted on-chain');
        }

        logger.info(`Workers assigned for task ${taskId}. Transaction: ${tx.hash}`);
        return { hash: tx.hash, blockNumber: receipt.blockNumber };
    } catch (error) {
        logger.error(`Failed to assign workers for task ${taskId} on-chain: ${error.message}`);
        throw new ApiError(500, 'Blockchain transaction failed during worker assignment.');
    }
};

const releaseBatchPayouts = async (taskId, workerAddresses) => {
    try {
        logger.info(`Releasing batch payout for task ${taskId} to ${workerAddresses.length} workers...`);
        const tx = await escrowContract.releaseBatchPayouts(taskId, workerAddresses);
        const receipt = await tx.wait();

        if (!receipt.status) {
            throw new Error('Transaction reverted on-chain');
        }

        logger.info(`Batch payout released for task ${taskId}. Transaction: ${tx.hash}`);
        return { hash: tx.hash, blockNumber: receipt.blockNumber };
    } catch (error) {
        logger.error(`Failed to release batch payout for task ${taskId}: ${error.message}`);
        throw new ApiError(500, 'Blockchain transaction failed during payout.');
    }
};

const completeTaskOnChain = async (taskId) => {
    try {
        logger.info(`Completing task ${taskId} on-chain and paying platform fee...`);
        const tx = await escrowContract.completeTask(taskId);
        const receipt = await tx.wait();

        if (!receipt.status) {
            throw new Error('Transaction reverted on-chain');
        }

        const onChainStatus = await escrowContract.getTaskStatus(taskId);
        if (onChainStatus !== TASK_STATUS.Completed) {
            logger.warn(`Task ${taskId} completed but status may not be updated. Status: ${onChainStatus}`);
        }

        logger.info(`Task ${taskId} completed on-chain. Transaction: ${tx.hash}`);
        return { hash: tx.hash, blockNumber: receipt.blockNumber };
    } catch (error) {
        logger.error(`Failed to complete task ${taskId} on-chain: ${error.message}`);
        throw new ApiError(500, 'Blockchain transaction failed during task completion.');
    }
};

const cancelAndRefundOnChain = async (taskId) => {
    try {
        logger.info(`Cancelling task ${taskId} on-chain and issuing refund...`);
        const tx = await escrowContract.cancelAndRefund(taskId);
        const receipt = await tx.wait();

        if (!receipt.status) {
            throw new Error('Transaction reverted on-chain');
        }

        const onChainStatus = await escrowContract.getTaskStatus(taskId);
        if (onChainStatus !== TASK_STATUS.Cancelled) {
            logger.warn(`Task ${taskId} cancellation may not be complete. Status: ${onChainStatus}`);
        }

        logger.info(`Task ${taskId} cancelled and refunded. Transaction: ${tx.hash}`);
        return { hash: tx.hash, blockNumber: receipt.blockNumber };
    } catch (error) {
        logger.error(`Failed to cancel task ${taskId} on-chain: ${error.message}`);
        throw new ApiError(500, 'Blockchain transaction failed during refund.');
    }
};

const getTaskOnChain = async (taskId) => {
    try {
        const task = await escrowContract.getTask(taskId);
        return {
            creator: task.creator,
            payout: task.payout.toString(),
            fee: task.fee.toString(),
            status: task.status,
            requiredWorkers: task.requiredWorkers.toString()
        };
    } catch (error) {
        logger.error(`Failed to get task ${taskId} from chain: ${error.message}`);
        throw new ApiError(500, 'Failed to retrieve task from blockchain.');
    }
};

const getTaskStatusOnChain = async (taskId) => {
    try {
        return await escrowContract.getTaskStatus(taskId);
    } catch (error) {
        logger.error(`Failed to get task status: ${error.message}`);
        throw new ApiError(500, 'Failed to retrieve task status.');
    }
};

export const escrowService = {
    createTaskOnChain,
    fundTaskOnChain,
    assignWorkersOnChain,
    releaseBatchPayouts,
    completeTaskOnChain,
    cancelAndRefundOnChain,
    getTaskOnChain,
    getTaskStatusOnChain,
    TASK_STATUS
};
