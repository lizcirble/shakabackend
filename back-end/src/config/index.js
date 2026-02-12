import dotenv from 'dotenv';
dotenv.config();

const config = {
    env: process.env.NODE_ENV,
    port: process.env.PORT,
    jwtSecret: process.env.JWT_SECRET,
    supabase: {
        url: process.env.SUPABASE_URL,
        anonKey: process.env.SUPABASE_ANON_KEY,
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
    privy: {
        appId: process.env.PRIVY_APP_ID,
        appSecret: process.env.PRIVY_APP_SECRET,
    },
    blockchain: {
        infuraApiKey: process.env.INFURA_API_KEY,
        deployerPrivateKey: process.env.DEPLOYER_PRIVATE_KEY,
        escrowContractAddress: process.env.TASK_ESCROW_CONTRACT_ADDRESS,
        platformWalletAddress: process.env.PLATFORM_WALLET_ADDRESS,
    },
    redis: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
    },
};

export default config;
