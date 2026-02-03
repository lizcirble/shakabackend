"use client";

import { useEffect, useState } from "react";
import { useWallets } from "@privy-io/react-auth";
import { useBalance } from "wagmi";

export function useWalletBalance(chainId?: number) {
  const { wallets } = useWallets();
  const [address, setAddress] = useState<string | undefined>();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (wallets.length > 0) {
      setAddress(wallets[0].address);
    }
  }, [wallets]);

  const { data: balance, isLoading, refetch } = useBalance({
    address: address as `0x${string}`,
    chainId,
    query: {
      enabled: mounted && !!address,
    },
  });

  if (!mounted) {
    return {
      balance: "0",
      symbol: "ETH",
      isLoading: true,
      address: undefined,
      refetch: () => {},
    };
  }

  return {
    balance: balance ? (Number(balance.value) / Math.pow(10, balance.decimals)).toFixed(4) : "0",
    symbol: balance?.symbol || "ETH",
    isLoading,
    address,
    refetch,
  };
}
