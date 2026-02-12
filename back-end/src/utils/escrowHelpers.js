const { contract } = require('../config/blockchainClient');
const logger = require('./logger');

/**
 * @file utils/escrowHelpers.js
 * @description Provides helper functions for interacting with the TaskEscrow smart contract.
 */

/**
 * Registers a new task in the smart contract.
 * @param {number} taskId - The unique ID of the task from Supabase.
 * @param {string} creatorAddress - The blockchain address of the task creator.
 * @param {number} payoutPerWorker - The payout amount for each worker.
 * @param {number} requiredWorkers - The number of workers required for the task.
 * @returns {Promise<Object>} Transaction receipt.
 */
const registerTaskInEscrow = async (taskId, creatorAddress, payoutPerWorker, requiredWorkers) => {
    try {
        const tx = await contract.createTask(taskId, creatorAddress, payoutPerWorker, requiredWorkers);
        await tx.wait();
        logger.info(`Task ${taskId} registered in escrow. Transaction hash: ${tx.hash}`);
        return tx;
    } catch (error) {
        logger.error(`Error registering task ${taskId} in escrow: ${error.message}`);
        throw error;
    }
};

/**
 * Funds a task in the smart contract.
 * @param {number} taskId - The unique ID of the task from Supabase.
 * @param {string} creatorAddress - The blockchain address of the task creator.
 * @param {number} amount - The total amount to fund (worker payouts + platform fee).
 * @returns {Promise<Object>} Transaction receipt.
 */
const fundTaskInEscrow = async (taskId, creatorAddress, amount) => {
    try {
        const tx = await contract.fundTaskByAdmin(taskId, creatorAddress, { value: amount });
        await tx.wait();
        logger.info(`Task ${taskId} funded by admin. Transaction hash: ${tx.hash}`);
        return tx;
    } catch (error) {
        logger.error(`Error funding task ${taskId} by admin: ${error.message}`);
        throw error;
    }
};

/**
 * Releases payout to a worker from the smart contract.
 * @param {number} taskId - The unique ID of the task from Supabase.
 * @param {string} workerAddress - The blockchain address of the worker.
 * @param {number} amount - The amount to payout.
 * @returns {Promise<Object>} Transaction receipt.
 */
const releasePayoutFromEscrow = async (taskId, workerAddress) => {
    try {
        const tx = await contract.releasePayout(taskId, workerAddress);
        await tx.wait();
        logger.info(`Payout released for task ${taskId} to worker ${workerAddress}. Transaction hash: ${tx.hash}`);
        return tx;
    } catch (error) {
        logger.error(`Error releasing payout for task ${taskId} to worker ${workerAddress}: ${error.message}`);
        throw error;
    }
};

/**
 * Pays the platform fee to the platform wallet.
 * @param {number} taskId - The unique ID of the task from Supabase.
 * @returns {Promise<Object>} Transaction receipt.
 */
const payPlatformFeeToEscrow = async (taskId) => {
    try {
        const tx = await contract.payPlatformFee(taskId);
        await tx.wait();
        logger.info(`Platform fee paid for task ${taskId}. Transaction hash: ${tx.hash}`);
        return tx;
    } catch (error) {
        logger.error(`Error paying platform fee for task ${taskId}: ${error.message}`);
        throw error;
    }
};

/**
 * Issues a refund to the task creator.
 * @param {number} taskId - The unique ID of the task from Supabase.
 * @returns {Promise<Object>} Transaction receipt.
 */
const issueRefundInEscrow = async (taskId) => {
    try {
        const tx = await contract.issueRefund(taskId);
        await tx.wait();
        logger.info(`Refund issued for task ${taskId}. Transaction hash: ${tx.hash}`);
        return tx;
    } catch (error) {
        logger.error(`Error issuing refund for task ${taskId}: ${error.message}`);
        throw error;
    }
};

module.exports = {
    registerTaskInEscrow,
    fundTaskInEscrow, // This needs to be re-evaluated based on contract change
    releasePayoutFromEscrow,
    payPlatformFeeToEscrow,
    issueRefundInEscrow,
};
