const { ethers } = require('ethers');
const TaskEscrowABI = require('../../../smart_contract/out/TaskEscrow.sol/TaskEscrow.json').abi;

const PLATFORM_FEE_PERCENTAGE = 0.15; // 15%

const provider = new ethers.providers.JsonRpcProvider(process.env.JSON_RPC_PROVIDER);
const taskEscrowContract = new ethers.Contract(process.env.TASK_ESCROW_CONTRACT_ADDRESS, TaskEscrowABI, provider);

module.exports = {
    provider,
    taskEscrowContract,
    PLATFORM_FEE_PERCENTAGE
};