import { PrivyClient } from '@privy-io/server-auth';
import config from './index.js';

const privyAppId = config.privy.appId;
const privyAppSecret = config.privy.appSecret;

if (!privyAppId || !privyAppSecret) {
    throw new Error('Privy App ID or Secret is not defined in the environment variables.');
}

const privyClient = new PrivyClient(privyAppId, privyAppSecret);

export default privyClient;