import type { PrivyClientConfig } from "@privy-io/react-auth";
import { base, baseSepolia, arbitrum, arbitrumSepolia } from "wagmi/chains";

export const privyConfig: PrivyClientConfig = {
  embeddedWallets: {
    ethereum: {
      createOnLogin: 'users-without-wallets', 
    },    
    showWalletUIs: true,
  },

  loginMethods: ['google', 'email'],

  appearance: {
    showWalletLoginFirst: true,
    logo: '/datarand-logo.svg',
  },

  defaultChain: base,
  supportedChains: [
    base,
    baseSepolia,
    arbitrum,
    arbitrumSepolia,
  ],
};