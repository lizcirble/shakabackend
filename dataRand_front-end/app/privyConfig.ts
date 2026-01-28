import type { PrivyClientConfig } from "@privy-io/react-auth";

export const privyConfig: PrivyClientConfig = {
  embeddedWallets: {
    ethereum: {
      createOnLogin: 'users-without-wallets', 
    },    
    showWalletUIs: true,
  },

  loginMethods: ['github', 'google', 'twitter', 'email'],

  appearance: {
    showWalletLoginFirst: true,
    logo: '/logo.png',
  },

  defaultChain: 'base',
  supportedChains: [
    'base',
    'base-sepolia',
    'arbitrum',
    'arbitrum-sepolia',
  ],
};
