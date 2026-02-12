const { PrivyClient } = require('@privy-io/server-auth');

const privyAppId = process.env.PRIVY_APP_ID;
const privyAppSecret = process.env.PRIVY_APP_SECRET;

const privy = new PrivyClient(privyAppId, privyAppSecret);

module.exports = privy;
