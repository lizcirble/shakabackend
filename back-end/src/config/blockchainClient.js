import { ethers } from 'ethers';
import config from './index.js';
import TaskEscrowABI from '../../abis/TaskEscrow.json' with { type: 'json' };

const infuraApiKey = config.blockchain.infuraApiKey;
const deployerPrivateKey = config.blockchain.deployerPrivateKey;
const escrowContractAddress = config.blockchain.escrowContractAddress;
const jsonRpcProvider = config.blockchain.jsonRpcProvider;

if (!deployerPrivateKey || !escrowContractAddress) {
    throw new Error('Blockchain configuration is missing from environment variables.');
}

// Using a default provider for now. In production, you'd want a more robust setup (e.g., multiple providers).
const provider = new ethers.JsonRpcProvider(jsonRpcProvider || 'https://arb-sep.g.alchemy.com/v2/demo');

// The wallet is the backend's identity on the blockchain, used to sign transactions.
const wallet = new ethers.Wallet(deployerPrivateKey, provider);

// The contract instance, connected to our backend wallet.
const escrowContract = new ethers.Contract(escrowContractAddress, TaskEscrowABI.abi, wallet);

export { provider, wallet, escrowContract };