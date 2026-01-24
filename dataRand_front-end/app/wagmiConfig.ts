// wagmiConfig.ts
import { createConfig } from "@privy-io/wagmi";
import { arbitrum, arbitrumSepolia, base, baseSepolia } from "wagmi/chains";
import { http } from "wagmi";

export const wagmiConfig = createConfig({
  chains: [base, baseSepolia, arbitrum, arbitrumSepolia],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
    [arbitrum.id]: http(),
    [arbitrumSepolia.id]: http(),
  },
});
