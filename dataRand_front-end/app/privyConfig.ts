// privyConfig.ts
import type { PrivyClientConfig } from "@privy-io/react-auth";
import { base, baseSepolia, arbitrum, arbitrumSepolia } from "wagmi/chains";

export const privyConfig: PrivyClientConfig = {
  loginMethods: ["google", "email"],

  embeddedWallets: {
    ethereum: {
      createOnLogin: "users-without-wallets", 
    },


  },

  appearance: {
    showWalletLoginFirst: true,
  },

  defaultChain: base,
  supportedChains: [
    base,
    baseSepolia,
    arbitrum,
    arbitrumSepolia,
  ],
};
