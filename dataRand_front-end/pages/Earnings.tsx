"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { useGlobalMetrics } from "@/hooks/useGlobalMetrics";
import withAuth from "@/components/withAuth";
import { supabase, type Transaction } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { WithdrawalDialog } from "@/components/earnings/WithdrawalDialog";
import { useToast } from "@/hooks/use-toast";
import { useWalletBalance } from "@/hooks/useWalletBalance";
import { useChainId, useChains, useSendTransaction, useSwitchChain, useWaitForTransactionReceipt } from "wagmi";
import QRCode from "react-qr-code";

const isHexAddress = (value: string) => /^0x[a-fA-F0-9]{40}$/.test(value.trim());

const parseEtherAmount = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return BigInt(0);
  const [whole, fraction = ""] = trimmed.split(".");
  const safeWhole = whole.replace(/^0+/, "") || "0";
  const safeFraction = fraction.replace(/[^0-9]/g, "").slice(0, 18).padEnd(18, "0");
  if (!/^\d+$/.test(safeWhole)) return BigInt(0);
  const base = BigInt(10) ** BigInt(18);
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

function Earnings() {
  const { profile, loading: authLoading } = useAuth();
  const { totalEarnings, earnedToday, educationFundContribution } = useGlobalMetrics();
  const router = useRouter();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawalOpen, setWithdrawalOpen] = useState(false);
  const [stats, setStats] = useState({
    available: 0,
    pending: 0,
    lifetime: 0,
    educationFund: 0,
    pendingWithdrawals: 0,
  });
  const { toast } = useToast();
  const chainId = useChainId();
  const chains = useChains();
  const { balance, symbol, isLoading: walletLoading, address, refetch: refetchWallet } = useWalletBalance(chainId);
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const { mutateAsync: sendTransactionAsync, data: txHash, isPending: isSending } = useSendTransaction();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });
  const availableWalletBalance = useMemo(() => {
    const parsed = Number(balance);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [balance]);
  const currentChain = useMemo(
    () => chains?.find((chain) => chain.id === chainId) || null,
    [chains, chainId]
  );

  useEffect(() => {
    if (!authLoading && !profile) {
      router.push("/auth");
    }
  }, [authLoading, profile, router]);

  const fetchData = async () => {
    if (!profile) return;
    
    setLoading(true);
    try {
      // Fetch transactions
      const { data: txns } = await supabase
        .from("transactions")
        .select("*")
        .eq("profile_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(50);

      setTransactions((txns as Transaction[]) || []);

      // Fetch withdrawal requests
      const { data: withdrawals } = await supabase
        .from("withdrawal_requests")
        .select("*")
        .eq("profile_id", profile.id)
        .order("created_at", { ascending: false });

      setWithdrawalRequests((withdrawals as WithdrawalRequest[]) || []);

      // Calculate stats
      const completed = (txns || []).filter(
        (t) => t.type === "earning" && t.status === "completed"
      );
      const pending = (txns || []).filter(
        (t) => t.type === "earning" && t.status === "pending"
      );
      const withdrawn = (txns || []).filter(
        (t) => t.type === "withdrawal" && t.status === "completed"
      );
      const eduFund = (txns || []).filter((t) => t.type === "education_fund");

      const totalEarned = completed.reduce((sum, t) => sum + Number(t.amount), 0);
      const totalWithdrawn = withdrawn.reduce(
        (sum, t) => sum + Math.abs(Number(t.amount)),
        0
      );
      const totalPending = pending.reduce((sum, t) => sum + Number(t.amount), 0);
      const totalEduFund = eduFund.reduce(
        (sum, t) => sum + Math.abs(Number(t.amount)),
        0
      );

      // Calculate pending withdrawals
      const pendingWithdrawals = (withdrawals || [])
        .filter((w) => w.status === "pending" || w.status === "processing")
        .reduce((sum, w) => sum + Number(w.amount), 0);

      setStats({
        available: totalEarned - totalWithdrawn - pendingWithdrawals,
        pending: totalPending,
        lifetime: totalEarned,
        educationFund: totalEduFund,
        pendingWithdrawals,
      });
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [profile]);

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
    earning: { label: "Earning", icon: ArrowUpRight, color: "text-green-500" },
    withdrawal: { label: "Withdrawal", icon: ArrowDownRight, color: "text-red-500" },
    bonus: { label: "Bonus", icon: TrendingUp, color: "text-yellow-500" },
    education_fund: { label: "Education Fund", icon: GraduationCap, color: "text-blue-500" },
    platform_fee: { label: "Platform Fee", icon: DollarSign, color: "text-muted-foreground" },
  };

  const statusConfig: Record<string, { label: string; color: string }> = {
    pending: { label: "Pending", color: "bg-yellow-500/10 text-yellow-500" },
    processing: { label: "Processing", color: "bg-blue-500/10 text-blue-500" },
    completed: { label: "Completed", color: "bg-green-500/10 text-green-500" },
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

    try {
      await sendTransactionAsync({
        to: withdrawAddress as `0x${string}`,
        value: parseEtherAmount(withdrawAmount),
        chainId,
      });
      toast({
        title: "Transaction submitted",
        description: "Confirm the transfer in your wallet.",
      });
    } catch (err) {
      console.error("Send error:", err);
      toast({
        title: "Transaction failed",
        description: "Unable to send the transaction. Please try again.",
        variant: "destructive",
      });
    }
  };

  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "Not connected";
  const chainLabel = currentChain?.name || "Select Network";

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-primary" />
            Earnings
          </h1>
          <p className="text-muted-foreground">
            Track your income and withdrawals
          </p>
        </div>

        {/* Stats Cards */}
        {loading ? (
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="border-border/50 bg-gradient-to-br from-primary/10 to-transparent">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  Available Balance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-display font-bold text-primary">
                  ${totalEarnings.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Minimum withdrawal: $5
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Pending
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-display font-bold">
                  ${stats.pending.toFixed(2)}
                </p>
                {stats.pendingWithdrawals > 0 && (
                  <p className="text-xs text-yellow-500 mt-1">
                    ${stats.pendingWithdrawals.toFixed(2)} withdrawal pending
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Lifetime Earned
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-display font-bold">
                  ${totalEarnings.toFixed(2)}
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-gradient-to-br from-secondary/10 to-transparent">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Education Fund
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-display font-bold text-secondary">
                  ${educationFundContribution.toFixed(2)}
                </p>
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
                <div className="rounded-lg border border-border/60 p-4 space-y-3 bg-muted/20">
                  <div className="space-y-2">
                    <Label>Network</Label>
                    <Select
                      value={chainId ? String(chainId) : ""}
                      onValueChange={(value) => switchChain({ chainId: Number(value) })}
                    >
                      <SelectTrigger disabled={!chains?.length || isSwitching}>
                        <SelectValue placeholder="Select network" />
                      </SelectTrigger>
                      <SelectContent>
                        {(chains || []).map((chain) => (
                          <SelectItem key={chain.id} value={String(chain.id)}>
                            {chain.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">Address</span>
                    <Badge variant="outline">{chainLabel}</Badge>
                  </div>
                  <div className="text-sm font-mono break-all">{address}</div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={handleCopyAddress}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => refetchWallet()}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                  <div className="pt-2 border-t border-border/60">
                    <p className="text-xs text-muted-foreground">Wallet Balance</p>
                    <p className="text-2xl font-display font-bold">
                      {walletLoading ? "Loading..." : `${balance} ${symbol}`}
                    </p>
                  </div>
                </div>

                <div className="lg:col-span-2 grid gap-4 md:grid-cols-2">
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
                    <Button variant="secondary" size="sm" onClick={handleCopyAddress}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Address
                    </Button>
                  </div>

                  <div className="rounded-lg border border-border/60 p-4 space-y-3">
                    <div>
                      <p className="text-sm font-semibold">Withdraw</p>
                      <p className="text-xs text-muted-foreground">
                        Send funds to another wallet.
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
                      <Label htmlFor="withdrawAmount">Amount ({symbol})</Label>
                      <Input
                        id="withdrawAmount"
                        type="number"
                        min="0"
                        step="0.0001"
                        value={withdrawAmount}
                        onChange={(event) => setWithdrawAmount(event.target.value)}
                        placeholder="0.01"
                      />
                    </div>
                    {withdrawError && (
                      <p className="text-xs text-destructive">{withdrawError}</p>
                    )}
                    <Button
                      className="w-full"
                      onClick={handleSendWithdrawal}
                      disabled={isSending || isConfirming || walletLoading}
                    >
                      {(isSending || isConfirming) ? (
                        "Processing..."
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Send Withdrawal
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Balance: {walletLoading ? "Loading..." : `${balance} ${symbol}`}
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
          <CardHeader>
            <CardTitle className="text-lg">Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
                  <DollarSign className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">
                  No transactions yet. Complete tasks to start earning!
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((txn) => {
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
                        <TableRow key={txn.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <TypeIcon className={`h-4 w-4 ${type.color}`} />
                              <span className="font-medium">{type.label}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {txn.description || "-"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={status.color}>
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell className={`text-right font-medium ${type.color}`}>
                            {txn.type === "withdrawal" || txn.type === "education_fund" || txn.type === "platform_fee"
                              ? "-"
                              : "+"}
                            ${Math.abs(Number(txn.amount)).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground text-sm">
                            {formatDistanceToNow(new Date(txn.created_at), {
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
      </div>
    </AppLayout>
  );
}

export default withAuth(Earnings);
