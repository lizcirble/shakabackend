"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { useGlobalMetrics } from "@/hooks/useGlobalMetrics";
import withAuth from "@/components/withAuth";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePrivy } from "@privy-io/react-auth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DollarSign,
  TrendingUp,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  GraduationCap,
  AlertCircle,
  Copy,
  Send,
  RefreshCw,
  Eye,
  EyeOff,
  Loader2,
  Filter,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { WithdrawalDialog } from "@/components/earnings/WithdrawalDialog";
import { useToast } from "@/hooks/use-toast";
import { useWalletBalance } from "@/hooks/useWalletBalance";
import { useChainId, useChains, useSendTransaction, useSwitchChain, useWaitForTransactionReceipt } from "wagmi";
import QRCode from "react-qr-code";
import { arbitrum, arbitrumSepolia } from "wagmi/chains";
import { formatUnits } from "viem";

const isHexAddress = (value: string) => /^0x[a-fA-F0-9]{40}$/.test(value.trim());

const parseTokenAmount = (value: string, decimals: number) => {
  const trimmed = value.trim();
  if (!trimmed) return BigInt(0);
  const [whole, fraction = ""] = trimmed.split(".");
  const safeWhole = whole.replace(/^0+/, "") || "0";
  const safeFraction = fraction.replace(/[^0-9]/g, "").slice(0, decimals).padEnd(decimals, "0");
  if (!/^\d+$/.test(safeWhole)) return BigInt(0);
  const base = BigInt(10) ** BigInt(decimals);
  const wholeWei = BigInt(safeWhole) * base;
  const fractionWei = BigInt(safeFraction || "0");
  return wholeWei + fractionWei;
};

interface WithdrawalRequest {
  id: string;
  amount: number;
  status: string;
  payment_method: string;
  created_at: string;
}

interface BlockchainTransaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  timestamp: number;
  blockNumber: number;
  type: "incoming" | "outgoing";
  status: "success" | "failed";
  gasUsed?: string;
  tokenSymbol?: string;
  tokenValue?: string;
}

function Earnings() {
  const { profile, loading: authLoading } = useAuth();
  const { totalEarnings, earnedToday, educationFundContribution } = useGlobalMetrics();
  const router = useRouter();
  const { exportWallet, user: privyUser } = usePrivy();
  const { toast } = useToast();
  
  // State hooks
  const [selectedChainId, setSelectedChainId] = useState<number>(arbitrumSepolia.id);
  const [transactions, setTransactions] = useState<BlockchainTransaction[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawalOpen, setWithdrawalOpen] = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [stats, setStats] = useState({
    available: 0,
    available_eth: 0,
    pending: 0,
    lifetime: 0,
    educationFund: 0,
    pendingWithdrawals: 0,
  });
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [txTypeFilter, setTxTypeFilter] = useState<"all" | "incoming" | "outgoing">("all");
  const [txStatusFilter, setTxStatusFilter] = useState<"all" | "success" | "failed">("all");
  
  // Wagmi hooks
  const chainId = useChainId();
  const chains = useChains();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const { mutateAsync: sendTransactionAsync, data: txHash, isPending: isSending } = useSendTransaction();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });
  const { usdcBalance, ethBalance, usdcSymbol, ethSymbol, isLoading: walletLoading, refetch: refetchWallet, usdcDecimals, ethDecimals } = useWalletBalance(selectedChainId);
  
  // Derived values
  const privyWalletAddress = privyUser?.wallet?.address || null;
  const address = privyWalletAddress;
  
  // Memoized values
  const availableWalletBalance = useMemo(() => {
    const parsed = Number(usdcBalance);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [usdcBalance]);
  
  const currentChain = useMemo(
    () => chains?.find((chain) => chain.id === selectedChainId) || null,
    [chains, selectedChainId]
  );
  
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      if (txTypeFilter !== "all" && tx.type !== txTypeFilter) return false;
      if (txStatusFilter !== "all" && tx.status !== txStatusFilter) return false;
      return true;
    });
  }, [transactions, txTypeFilter, txStatusFilter]);

  const handleChainToggle = (chainId: number) => {
    console.log('Chain toggled to:', chainId);
    setSelectedChainId(chainId);
    setTransactions([]); // Clear transactions immediately
    setLoading(true); // Show loading state
  };

  // Fetch blockchain transactions from Arbiscan API
  const fetchBlockchainTransactions = async (walletAddress: string, chainId: number) => {
    try {
      const isTestnet = chainId === arbitrumSepolia.id;
      const apiUrl = isTestnet 
        ? `https://api-sepolia.arbiscan.io/api`
        : `https://api.arbiscan.io/api`;
      
      const apiKey = process.env.NEXT_PUBLIC_ARBISCAN_API_KEY || "YourApiKeyToken";
      
      console.log('Fetching transactions for:', walletAddress, 'on chain:', chainId);
      
      // Fetch normal transactions
      const normalTxResponse = await fetch(
        `${apiUrl}?module=account&action=txlist&address=${walletAddress}&startblock=0&endblock=99999999&sort=desc&apikey=${apiKey}`
      );
      const normalTxData = await normalTxResponse.json();
      
      console.log('Normal tx response:', normalTxData.status, normalTxData.message);
      
      // Fetch internal transactions
      const internalTxResponse = await fetch(
        `${apiUrl}?module=account&action=txlistinternal&address=${walletAddress}&startblock=0&endblock=99999999&sort=desc&apikey=${apiKey}`
      );
      const internalTxData = await internalTxResponse.json();
      
      // Fetch ERC20 token transfers
      const tokenTxResponse = await fetch(
        `${apiUrl}?module=account&action=tokentx&address=${walletAddress}&startblock=0&endblock=99999999&sort=desc&apikey=${apiKey}`
      );
      const tokenTxData = await tokenTxResponse.json();

      const allTxs: BlockchainTransaction[] = [];

      // Process normal transactions
      if (normalTxData.status === "1" && Array.isArray(normalTxData.result)) {
        console.log('Found', normalTxData.result.length, 'normal transactions');
        normalTxData.result.forEach((tx: any) => {
          allTxs.push({
            hash: tx.hash,
            from: tx.from,
            to: tx.to,
            value: formatUnits(BigInt(tx.value), 18),
            timestamp: parseInt(tx.timeStamp) * 1000,
            blockNumber: parseInt(tx.blockNumber),
            type: tx.from.toLowerCase() === walletAddress.toLowerCase() ? "outgoing" : "incoming",
            status: tx.isError === "0" ? "success" : "failed",
            gasUsed: tx.gasUsed,
            tokenSymbol: "ETH",
          });
        });
      }

      // Process internal transactions
      if (internalTxData.status === "1" && Array.isArray(internalTxData.result)) {
        internalTxData.result.forEach((tx: any) => {
          allTxs.push({
            hash: tx.hash,
            from: tx.from,
            to: tx.to,
            value: formatUnits(BigInt(tx.value), 18),
            timestamp: parseInt(tx.timeStamp) * 1000,
            blockNumber: parseInt(tx.blockNumber),
            type: tx.from.toLowerCase() === walletAddress.toLowerCase() ? "outgoing" : "incoming",
            status: tx.isError === "0" ? "success" : "failed",
            tokenSymbol: "ETH",
          });
        });
      }

      // Process token transactions
      if (tokenTxData.status === "1" && Array.isArray(tokenTxData.result)) {
        tokenTxData.result.forEach((tx: any) => {
          const decimals = parseInt(tx.tokenDecimal) || 18;
          allTxs.push({
            hash: tx.hash,
            from: tx.from,
            to: tx.to,
            value: formatUnits(BigInt(tx.value), decimals),
            timestamp: parseInt(tx.timeStamp) * 1000,
            blockNumber: parseInt(tx.blockNumber),
            type: tx.from.toLowerCase() === walletAddress.toLowerCase() ? "outgoing" : "incoming",
            status: "success",
            tokenSymbol: tx.tokenSymbol,
            tokenValue: formatUnits(BigInt(tx.value), decimals),
          });
        });
      }

      // Sort by timestamp descending
      allTxs.sort((a, b) => b.timestamp - a.timestamp);
      
      return allTxs;
    } catch (error) {
      console.error("Error fetching blockchain transactions:", error);
      return [];
    }
  };

  useEffect(() => {
    if (!authLoading && !profile) {
      router.push("/auth");
    }
  }, [authLoading, profile, router]);

  const fetchData = async () => {
    if (!profile || !address) return;
    
    setLoading(true);
    try {
      // Fetch blockchain transactions
      const blockchainTxs = await fetchBlockchainTransactions(address, selectedChainId);
      setTransactions(blockchainTxs);

      const { data: withdrawals } = await supabase
        .from("withdrawal_requests")
        .select("*")
        .eq("profile_id", profile.id)
        .order("created_at", { ascending: false });

      setWithdrawalRequests((withdrawals as WithdrawalRequest[]) || []);

      const pendingWithdrawals = (withdrawals || [])
        .filter((w) => w.status === "pending" || w.status === "processing")
        .reduce((sum, w) => sum + Number(w.amount), 0);

      // Calculate stats from blockchain transactions
      const incoming = blockchainTxs.filter(tx => tx.type === "incoming" && tx.status === "success");
      const outgoing = blockchainTxs.filter(tx => tx.type === "outgoing" && tx.status === "success");
      
      const totalReceived = incoming.reduce((sum, tx) => sum + parseFloat(tx.value || "0"), 0);
      const totalSent = outgoing.reduce((sum, tx) => sum + parseFloat(tx.value || "0"), 0);

      // Fetch ETH price
      let ethPrice = 0;
      try {
        const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd");
        const data = await response.json();
        ethPrice = data.ethereum.usd;
      } catch (e) {
        console.error("Failed to fetch ETH price", e);
      }

      const available_eth = parseFloat(ethBalance);
      const available_usd = available_eth * ethPrice;

      setStats({
        available: available_usd,
        available_eth: available_eth,
        pending: 0,
        lifetime: totalReceived * ethPrice,
        educationFund: educationFundContribution,
        pendingWithdrawals,
      });
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('Fetching data for chain:', selectedChainId, 'address:', address);
    fetchData();
  }, [profile, address, selectedChainId, ethBalance]);

  useEffect(() => {
    if (isConfirmed && txHash) {
      toast({
        title: "Withdrawal sent",
        description: "Your transfer is confirmed.",
      });
      refetchWallet();
      setWithdrawAmount("");
      setWithdrawAddress("");
    }
  }, [isConfirmed, txHash, refetchWallet, toast]);


  if (authLoading) {
    return null;
  }

  const typeConfig: Record<
    string,
    { label: string; icon: typeof DollarSign; color: string }
  > = {
    incoming: { label: "Received", icon: ArrowUpRight, color: "text-green-500" },
    outgoing: { label: "Sent", icon: ArrowDownRight, color: "text-red-500" },
  };

  const statusConfig: Record<string, { label: string; color: string }> = {
    pending: { label: "Pending", color: "bg-yellow-500/10 text-yellow-500" },
    processing: { label: "Processing", color: "bg-blue-500/10 text-blue-500" },
    completed: { label: "Completed", color: "bg-green-500/10 text-green-500" },
    success: { label: "Success", color: "bg-green-500/10 text-green-500" },
    failed: { label: "Failed", color: "bg-red-500/10 text-red-500" },
    rejected: { label: "Rejected", color: "bg-red-500/10 text-red-500" },
  };


  const paymentMethodLabels: Record<string, string> = {
    mpesa: "M-Pesa",
    moniepoint: "Moniepoint",
    chipper: "Chipper Cash",
    bank: "Bank Transfer",
  };

  const handleCopyAddress = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      toast({
        title: "Address copied",
        description: "Wallet address copied to clipboard.",
      });
    } catch (err) {
      console.error("Copy failed:", err);
      toast({
        title: "Copy failed",
        description: "Unable to copy address. Please copy manually.",
        variant: "destructive",
      });
    }
  };

  const handleSendWithdrawal = async () => {
    setWithdrawError(null);

    if (!address) {
      setWithdrawError("No wallet found. Please connect and try again.");
      return;
    }

    if (!chainId) {
      setWithdrawError("Select a network to continue.");
      return;
    }

    if (!isHexAddress(withdrawAddress)) {
      setWithdrawError("Enter a valid recipient address.");
      return;
    }

    const amountValue = Number(withdrawAmount);
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      setWithdrawError("Enter a valid amount to withdraw.");
      return;
    }

    if (amountValue > availableWalletBalance) {
      setWithdrawError("Amount exceeds your wallet balance.");
      return;
    }

    // Show confirmation modal instead of sending directly
    setShowConfirmModal(true);
  };

  const handleRefreshWallet = async () => {
    setIsRefreshing(true);
    try {
      await refetchWallet();
      toast({
        title: "Wallet refreshed",
        description: "Balance and wallet data updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Refresh failed",
        description: "Unable to refresh wallet data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setTimeout(() => setIsRefreshing(false), 500); // Keep animation for a bit
    }
  };

  const confirmSendWithdrawal = async () => {
    try {
      if (!usdcDecimals) {
        setWithdrawError("Could not determine token decimals.");
        setShowConfirmModal(false);
        return;
      }
      await sendTransactionAsync({
        to: withdrawAddress as `0x${string}`,
        value: parseTokenAmount(withdrawAmount, usdcDecimals),
        chainId: selectedChainId,
      });
      toast({
        title: "Transaction submitted",
        description: "Confirm the transfer in your wallet.",
      });
      setShowConfirmModal(false);
    } catch (err) {
      console.error("Send error:", err);
      toast({
        title: "Transaction failed",
        description: "Unable to send the transaction. Please try again.",
        variant: "destructive",
      });
      setShowConfirmModal(false);
    }
  };

  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "Not connected";
  const chainLabel = currentChain?.name?.replace(" One", "") || "Select Network";
  const displayBalance = `${usdcBalance} ${usdcSymbol} / ${ethBalance} ${ethSymbol}`;

  return (
    <AppLayout>
      <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold flex items-center gap-2">
            <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            Earnings
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Track your income and withdrawals
          </p>
        </div>

        {/* Stats Cards */}
        {loading ? (
          <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24 sm:h-32 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-4">
            <Card className="border-border/50 bg-gradient-to-br from-primary/10 to-transparent">
              <CardHeader className="pb-2 p-3 sm:p-6">
                <CardDescription className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                  <Wallet className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="truncate">Available</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0">
                <div className="flex items-center gap-2">
                  <img src="https://cryptologos.cc/logos/usd-coin-usdc-logo.png" alt="USDC" className="h-5 w-5" />
                  <p className="text-xl sm:text-3xl font-display font-bold text-primary">
                    ${stats.available.toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <img src="https://cryptologos.cc/logos/ethereum-eth-logo.png" alt="ETH" className="h-4 w-4" />
                  <p className="text-xs text-muted-foreground">
                    {stats.available_eth.toFixed(4)} ETH
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader className="pb-2 p-3 sm:p-6">
                <CardDescription className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="truncate">Pending</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0">
                <div className="flex items-center gap-2">
                  <img src="https://cryptologos.cc/logos/usd-coin-usdc-logo.png" alt="USDC" className="h-5 w-5" />
                  <p className="text-xl sm:text-3xl font-display font-bold">
                    ${stats.pending.toFixed(2)}
                  </p>
                </div>
                {stats.pendingWithdrawals > 0 && (
                  <p className="text-xs text-yellow-500 mt-1 truncate">
                    ${stats.pendingWithdrawals.toFixed(2)} pending
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader className="pb-2 p-3 sm:p-6">
                <CardDescription className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                  <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="truncate">Lifetime</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0">
                <div className="flex items-center gap-2">
                  <img src="https://cryptologos.cc/logos/usd-coin-usdc-logo.png" alt="USDC" className="h-5 w-5" />
                  <p className="text-xl sm:text-3xl font-display font-bold">
                  ${totalEarnings.toFixed(2)}
                </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-gradient-to-br from-secondary/10 to-transparent">
              <CardHeader className="pb-2 p-3 sm:p-6">
                <CardDescription className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                  <GraduationCap className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="truncate">Education Fund</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0">
                <div className="flex items-center gap-2">
                  <img src="https://cryptologos.cc/logos/usd-coin-usdc-logo.png" alt="USDC" className="h-5 w-5" />
                  <p className="text-xl sm:text-3xl font-display font-bold text-secondary">
                    ${educationFundContribution.toFixed(2)}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  15% of ComputeShare earnings fund education
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Withdraw Button */}
        <Card className="border-border/50">
          <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6">
            <div className="text-center sm:text-left">
              <h3 className="font-semibold">Ready to withdraw?</h3>
              <p className="text-sm text-muted-foreground">
                Transfer via M-Pesa, Moniepoint, Chipper Cash, or Bank
              </p>
            </div>
            <Button
              onClick={() => setWithdrawalOpen(true)}
              className="gradient-primary text-primary-foreground font-semibold"
              disabled={stats.available < 5}
            >
              <Wallet className="h-4 w-4 mr-2" />
              Withdraw ${stats.available.toFixed(2)}
            </Button>
          </CardContent>
        </Card>

        {/* Wallet */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              Wallet
            </CardTitle>
            <CardDescription>
              Receive funds with your wallet address, or send funds to another address.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!address ? (
              <div className="rounded-lg border border-dashed border-border/70 p-6 text-center text-sm text-muted-foreground">
                No wallet detected yet. Connect a wallet to continue.
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-lg border border-border/60 p-3 sm:p-4 space-y-3 bg-muted/20">
                  <div className="space-y-2">
                    <Label className="text-xs sm:text-sm">Network</Label>
                    <Select
                      value={String(selectedChainId)}
                      onValueChange={(value) => {
                        const newChainId = Number(value);
                        console.log('Chain selector changed to:', newChainId);
                        setSelectedChainId(newChainId);
                        setTransactions([]); // Clear old transactions
                        setLoading(true); // Show loading
                        if (chainId !== newChainId) {
                          switchChain({ chainId: newChainId });
                        }
                      }}
                    >
                      <SelectTrigger disabled={isSwitching} className="text-xs sm:text-sm">
                        <SelectValue placeholder="Select network" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={String(arbitrum.id)}>
                          <span className="flex items-center gap-2">
                            <img src="https://cryptologos.cc/logos/arbitrum-arb-logo.png" alt="" className="h-4 w-4" />
                            Arbitrum
                          </span>
                        </SelectItem>
                        <SelectItem value={String(arbitrumSepolia.id)}>
                          <span className="flex items-center gap-2">
                            <img src="https://cryptologos.cc/logos/arbitrum-arb-logo.png" alt="" className="h-4 w-4" />
                            Arbitrum Sepolia
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">Address</span>
                    <Badge variant="outline" className="text-xs flex items-center gap-1">
                      <img src="https://cryptologos.cc/logos/arbitrum-arb-logo.png" alt="Arbitrum" className="h-3 w-3" />
                      {chainLabel}
                    </Badge>
                  </div>
                  <div className="text-xs sm:text-sm font-mono break-all">{address}</div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={handleCopyAddress} className="text-xs">
                      <Copy className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      Copy
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleRefreshWallet} disabled={isRefreshing} className="text-xs">
                      <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                      Refresh
                    </Button>
                    <Button variant="ghost" size="sm" onClick={exportWallet} className="text-xs">
                      <Wallet className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      Manage
                    </Button>
                  </div>
                  <div className="pt-2 border-t border-border/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">Wallet Balance</p>
                      <Button variant="ghost" size="sm" onClick={() => setBalanceVisible(!balanceVisible)} className="h-6 w-6 p-0">
                        {balanceVisible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      </Button>
                    </div>
                    {balanceVisible ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <img src="https://cryptologos.cc/logos/usd-coin-usdc-logo.png" alt="USDC" className="h-5 w-5" />
                          <p className="text-lg sm:text-xl font-display font-bold">
                            {walletLoading ? "..." : `${parseFloat(usdcBalance).toFixed(2)} ${usdcSymbol}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <img src="https://cryptologos.cc/logos/ethereum-eth-logo.png" alt="ETH" className="h-5 w-5" />
                          <p className="text-lg sm:text-xl font-display font-bold">
                            {walletLoading ? "..." : `${parseFloat(ethBalance).toFixed(4)} ${ethSymbol}`}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-lg sm:text-xl font-display font-bold">••••••</p>
                    )}
                  </div>
                </div>

                <div className="lg:col-span-2 grid gap-4 grid-cols-1 sm:grid-cols-2">
                  <div className="rounded-lg border border-border/60 p-4 space-y-3">
                    <div>
                      <p className="text-sm font-semibold">Receive</p>
                      <p className="text-xs text-muted-foreground">
                        Share your wallet address to receive funds.
                      </p>
                    </div>
                    <div className="flex items-center justify-center rounded-lg border border-dashed border-border/70 bg-muted/30 p-4">
                      <div className="rounded-md bg-white p-2">
                        <QRCode value={address} size={160} />
                      </div>
                    </div>
                    <div className="rounded-md bg-muted/40 p-3 text-xs font-mono break-all">
                      {shortAddress}
                    </div>
                  </div>

                  <div className="rounded-lg border border-border/60 p-4 space-y-3">
                    <div>
                      <p className="text-sm font-semibold">Send</p>
                      <p className="text-xs text-muted-foreground">
                        Transfer funds to another wallet.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="withdrawAddress">Recipient Address</Label>
                      <Input
                        id="withdrawAddress"
                        value={withdrawAddress}
                        onChange={(event) => setWithdrawAddress(event.target.value)}
                        placeholder="0x..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="withdrawAmount">Amount ({usdcSymbol})</Label>
                      <Input
                        id="withdrawAmount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={withdrawAmount}
                        onChange={(event) => setWithdrawAmount(event.target.value)}
                        placeholder="10.00"
                      />
                    </div>
                    {withdrawError && (
                      <p className="text-xs text-destructive">{withdrawError}</p>
                    )}
                    <Button
                      className="w-full"
                      onClick={handleSendWithdrawal}
                      disabled={
                        isSending || 
                        isConfirming || 
                        walletLoading || 
                        !withdrawAddress.trim() || 
                        !withdrawAmount.trim() ||
                        Number(withdrawAmount) <= 0
                      }
                    >
                      {(isSending || isConfirming) ? (
                        "Processing..."
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Send Funds
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Balance: {walletLoading ? "Loading..." : displayBalance}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Withdrawal Requests */}
        {withdrawalRequests.filter(w => w.status !== "completed").length > 0 && (
          <Card className="border-yellow-500/30 bg-yellow-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-500" />
                Pending Withdrawals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {withdrawalRequests
                  .filter(w => w.status !== "completed")
                  .map((w) => (
                    <div
                      key={w.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-background border border-border/50"
                    >
                      <div>
                        <p className="font-medium">${Number(w.amount).toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">
                          via {paymentMethodLabels[w.payment_method] || w.payment_method}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant="outline"
                          className={statusConfig[w.status]?.color || ""}
                        >
                          {statusConfig[w.status]?.label || w.status}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(w.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Transaction History */}
        <Card className="border-border/50">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <CardTitle className="text-base sm:text-lg">Transaction History</CardTitle>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <Select value={txTypeFilter} onValueChange={(value: any) => setTxTypeFilter(value)}>
                  <SelectTrigger className="w-full sm:w-[140px] text-xs sm:text-sm">
                    <Filter className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="incoming">Incoming</SelectItem>
                    <SelectItem value="outgoing">Outgoing</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={txStatusFilter} onValueChange={(value: any) => setTxStatusFilter(value)}>
                  <SelectTrigger className="w-full sm:w-[140px] text-xs sm:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-center px-4">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-muted mb-3">
                  <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
                </div>
                <p className="text-sm sm:text-base text-muted-foreground">
                  No transactions found. Start using your wallet to see transaction history!
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Hash</TableHead>
                      <TableHead>From/To</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((txn) => {
                      const type = typeConfig[txn.type] || {
                        label: txn.type,
                        icon: DollarSign,
                        color: "text-muted-foreground",
                      };
                      const status = statusConfig[txn.status] || {
                        label: txn.status,
                        color: "",
                      };
                      const TypeIcon = type.icon;

                      return (
                        <TableRow key={txn.hash}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <TypeIcon className={`h-4 w-4 ${type.color}`} />
                              <span className="font-medium">{type.label}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            <a 
                              href={`https://${selectedChainId === arbitrumSepolia.id ? 'sepolia.' : ''}arbiscan.io/tx/${txn.hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              {txn.hash.slice(0, 10)}...
                            </a>
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {txn.type === "incoming" 
                              ? `${txn.from.slice(0, 6)}...${txn.from.slice(-4)}`
                              : `${txn.to.slice(0, 6)}...${txn.to.slice(-4)}`
                            }
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={status.color}>
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell className={`text-right font-medium ${type.color}`}>
                            {txn.type === "outgoing" ? "-" : "+"}
                            {parseFloat(txn.value).toFixed(6)} {txn.tokenSymbol}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground text-sm">
                            {formatDistanceToNow(new Date(txn.timestamp), {
                              addSuffix: true,
                            })}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Withdrawal Dialog */}
        {profile && (
          <WithdrawalDialog
            open={withdrawalOpen}
            onOpenChange={setWithdrawalOpen}
            availableBalance={stats.available}
            profileId={profile.id}
            onSuccess={fetchData}
          />
        )}

        {/* Transaction Confirmation Modal */}
        <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-500" />
                Confirm Transaction
              </DialogTitle>
              <DialogDescription>
                Please review the transaction details before confirming.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Recipient Address</Label>
                <div className="p-3 rounded-lg bg-muted font-mono text-sm break-all">
                  {withdrawAddress}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Amount</Label>
                <div className="p-3 rounded-lg bg-muted font-semibold">
                  {withdrawAmount} {usdcSymbol}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Network</Label>
                <div className="p-3 rounded-lg bg-muted">
                  {chainLabel}
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmSendWithdrawal}
                  disabled={isSending || isConfirming}
                  className="flex-1"
                >
                  {(isSending || isConfirming) ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Confirm & Send"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}

export default withAuth(Earnings);

