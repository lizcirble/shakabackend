import { ethers } from 'ethers';
import config from './index.js';
import TaskEscrowABI from '../../abis/TaskEscrow.json' with { type: 'json' };

const { infuraApiKey, deployerPrivateKey, escrowContractAddress } = config.blockchain;

if (!infuraApiKey || !deployerPrivateKey || !escrowContractAddress) {
    throw new Error('Blockchain configuration is missing from environment variables.');
}

// Using a default provider for now. In production, you'd want a more robust setup (e.g., multiple providers).
const provider = new ethers.InfuraProvider('sepolia', infuraApiKey);

// The wallet is the backend's identity on the blockchain, used to sign transactions.
const wallet = new ethers.Wallet(deployerPrivateKey, provider);

// The contract instance, connected to our backend wallet.
const escrowContract = new ethers.Contract(escrowContractAddress, TaskEscrowABI.abi, wallet);

export { provider, wallet, escrowContract };