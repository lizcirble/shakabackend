// providers.tsx
"use client"
import React from "react";
import { PrivyProvider } from "@privy-io/react-auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "@privy-io/wagmi";

import { privyConfig } from "./privyConfig";
import { wagmiConfig } from "./wagmiConfig";

const queryClient = new QueryClient();

const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

if (!privyAppId) {
  throw new Error("NEXT_PUBLIC_PRIVY_APP_ID is not set. Please set this environment variable.");
}

export default function Provider({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={privyAppId as string}
      config={privyConfig}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>
          {children}
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
