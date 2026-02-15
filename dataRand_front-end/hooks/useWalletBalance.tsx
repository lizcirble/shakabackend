"use client";

import { useEffect, useState } from "react";
import { useWallets } from "@privy-io/react-auth";
import { useBalance } from "wagmi";
import { arbitrum, arbitrumSepolia } from "wagmi/chains";
import { formatUnits, Address } from "viem";

const usdcAddresses: { [key: number]: Address } = {
  [arbitrum.id]: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
  [arbitrumSepolia.id]: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
};

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

  const usdcTokenAddress = chainId ? usdcAddresses[chainId] : undefined;

  const { data: usdcBalanceData, isLoading: usdcLoading, refetch: refetchUsdc } = useBalance({
    address: address as Address,
    chainId,
    ...(usdcTokenAddress && { token: usdcTokenAddress }),
    query: {
      enabled: mounted && !!address && !!chainId && !!usdcTokenAddress,
    },
  } as any);

  const { data: ethBalanceData, isLoading: ethLoading, refetch: refetchEth } = useBalance({
    address: address as Address,
    chainId,
    query: {
      enabled: mounted && !!address && !!chainId,
    },
  });

  const refetch = () => {
    refetchUsdc();
    refetchEth();
  };

  useEffect(() => {
    console.log("useWalletBalance mounted:", mounted);
    console.log("useWalletBalance address:", address);
    console.log("useWalletBalance chainId:", chainId);
    console.log("useWalletBalance usdcBalanceData data:", usdcBalanceData);
    console.log("useWalletBalance ethBalanceData data:", ethBalanceData);
    if (usdcBalanceData) {
      console.log("usdcBalanceData.value:", usdcBalanceData.value);
      console.log("usdcBalanceData.decimals:", usdcBalanceData.decimals);
    }
    if (ethBalanceData) {
      console.log("ethBalanceData.value:", ethBalanceData.value);
      console.log("ethBalanceData.decimals:", ethBalanceData.decimals);
    }
  }, [mounted, address, chainId, usdcBalanceData, ethBalanceData]);

  if (!mounted) {
    return {
      usdcBalance: "0",
      ethBalance: "0",
      usdcSymbol: "USDC",
      ethSymbol: "ETH",
      isLoading: true,
      address: undefined,
      refetch: () => {},
      usdcDecimals: 6,
      ethDecimals: 18,
    };
  }

  const usdcBalance = usdcBalanceData?.value ? parseFloat(formatUnits(usdcBalanceData.value, usdcBalanceData.decimals || 6)).toFixed(2) : "0";
  const ethBalance = ethBalanceData?.value ? parseFloat(formatUnits(ethBalanceData.value, ethBalanceData.decimals || 18)).toFixed(4) : "0";

  return {
    usdcBalance,
    ethBalance,
    usdcSymbol: "USDC",
    ethSymbol: ethBalanceData?.symbol || "ETH",
    isLoading: usdcLoading || ethLoading,
    address,
    refetch,
    usdcDecimals: 6, // Hardcode to 6 for USDC
    ethDecimals: 18, // Hardcode to 18 for ETH
  };
}
