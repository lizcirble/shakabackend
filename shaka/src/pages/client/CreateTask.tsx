import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { useWalletBalance } from "@/hooks/useWalletBalance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Image, Headphones, Brain, Plus, DollarSign, Users, Globe, Upload, X, Video, Wallet, CheckCircle, AlertCircle } from "lucide-react";
import { z } from "zod";
import { ethers } from "ethers";
import { api, CONFIG, getDeviceFingerprint } from "@/lib/datarand";

// Task categories matching backend
const TASK_CATEGORIES = [
  { value: "Image Labeling", label: "🖼️ Image Labeling", icon: Image },
  { value: "Audio Transcription", label: "🎙️ Audio Transcription", icon: Headphones },
  { value: "AI Evaluation", label: "🤖 AI Evaluation", icon: Brain },
  { value: "ComputeShare", label: "💻 ComputeShare", icon: Brain },
];

const AFRICAN_COUNTRIES = [
  "Nigeria", "Kenya", "South Africa", "Ghana", "Ethiopia", "Tanzania",
  "Uganda", "Rwanda", "Senegal", "Morocco", "Egypt", "Tunisia",
  "Cameroon", "Ivory Coast", "Zimbabwe", "Zambia", "Mozambique", "Angola"
];

const TARGET_REGIONS = [
  { value: "all", label: "All Countries" },
  { value: "africa", label: "African Countries" },
  { value: "india", label: "India" },
  { value: "custom", label: "Select Specific Countries" },
];

export default function CreateTask() {
  const { profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  
  // DataRand specific states
  const [step, setStep] = useState<"create" | "fund">("create");
  const [createdTask, setCreatedTask] = useState<any>(null);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [fundingTx, setFundingTx] = useState<string | null>(null);
  
  // Use wallet balance hook
  const { ethBalance, usdcBalance, ethSymbol, usdcSymbol, isLoading: balanceLoading, refetch: refetchBalance } = useWalletBalance(walletAddress || undefined, 421614);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    instructions: "",
    payoutPerWorker: "",
    requiredWorkers: "1",
    deadline: "",
    category: "Image Labeling",
  });

  // Calculate costs
  const payoutETH = parseFloat(formData.payoutPerWorker) || 0;
  const workers = parseInt(formData.requiredWorkers) || 1;
  const subtotal = payoutETH * workers;
  const platformFee = subtotal * (CONFIG.PLATFORM_FEE_PERCENTAGE / 100);
  const totalCost = subtotal + platformFee;
  const hasEnoughBalance = parseFloat(ethBalance) >= totalCost;

  useEffect(() => {
    if (!authLoading && !profile) {
      navigate("/auth");
      return;
    }
    if (!authLoading && profile && profile.role !== "client") {
      navigate("/tasks");
    }
  }, [authLoading, profile, navigate]);

  // Check for injected wallet (MetaMask etc)
  useEffect(() => {
    const checkWallet = async () => {
      if (window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const accounts = await provider.listAccounts();
          if (accounts.length > 0) {
            setWalletConnected(true);
            setWalletAddress(accounts[0].address);
            refetchBalance();
          }
        } catch (e) {
          console.error("Error checking wallet:", e);
        }
      }
    };
    checkWallet();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image or video.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 50MB.",
        variant: "destructive",
      });
      return;
    }

    setMediaFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getTargetCountries = (): string[] => {
    switch (selectedRegion) {
      case "all": return ["all"];
      case "africa": return AFRICAN_COUNTRIES;
      case "india": return ["India"];
      case "custom": return selectedCountries.length > 0 ? selectedCountries : ["all"];
      default: return ["all"];
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      toast({
        title: "No wallet found",
        description: "Please install MetaMask or another wallet.",
        variant: "destructive",
      });
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const accounts = await provider.listAccounts();
      
      setWalletConnected(true);
      setWalletAddress(accounts[0].address);
      refetchBalance();

      // Switch to Arbitrum Sepolia
      try {
        await provider.send("wallet_switchEthereumChain", [{ chainId: CONFIG.CHAIN_ID }]);
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          await provider.send("wallet_addEthereumChain", [{
            chainId: CONFIG.CHAIN_ID,
            chainName: CONFIG.CHAIN_NAME,
            rpcUrls: [CONFIG.RPC_URL],
            blockExplorerUrls: [CONFIG.BLOCK_EXPLORER],
            nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
          }]);
        }
      }

      toast({
        title: "Wallet connected",
        description: `Connected: ${accounts[0].address.slice(0, 6)}...${accounts[0].address.slice(-4)}`,
      });
    } catch (error: any) {
      toast({
        title: "Connection failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCreateTask = async () => {
    if (!profile) return;
    if (!formData.title || !formData.description || !formData.payoutPerWorker) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Transform to backend format
      const taskData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        payoutPerWorker: parseFloat(formData.payoutPerWorker),
        requiredWorkers: parseInt(formData.requiredWorkers),
        deadline: formData.deadline || null,
      };

      const result = await api.createTask(taskData);
      setCreatedTask(result.task);
      setStep("fund");

      toast({
        title: "Task created!",
        description: "Now fund the task to make it available.",
      });
    } catch (error: any) {
      console.error("Create task error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create task.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFundTask = async () => {
    if (!createdTask || !walletConnected || !walletAddress) return;

    setLoading(true);

    try {
      // Step 1: Get transaction data from backend
      const fundingData = await api.fundTask(createdTask.id);
      
      if (!fundingData?.txData) {
        throw new Error("Failed to prepare transaction data.");
      }

      // Step 2: Get the Ethereum provider
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Step 3: Send the transaction
      toast({
        title: "Sign Transaction",
        description: "Please sign the transaction in your wallet to fund the task.",
      });

      const tx = await signer.sendTransaction({
        to: fundingData.txData.to,
        data: fundingData.txData.data,
        value: fundingData.txData.value,
      });

      // Step 4: Wait for confirmation
      toast({
        title: "Transaction Sent",
        description: "Waiting for confirmation...",
      });

      const receipt = await tx.wait();

      if (!receipt || receipt.status === 0) {
        throw new Error("Transaction failed on blockchain.");
      }

      // Step 5: Confirm funding with backend
      await api.confirmTaskFunding(createdTask.id, tx.hash);
      
      setFundingTx(tx.hash);
      
      toast({
        title: "Task funded!",
        description: "Your task is now live and workers can start working on it.",
      });

      // Reset and redirect
      setTimeout(() => {
        navigate("/client/tasks");
      }, 2000);
    } catch (error: any) {
      console.error("Fund task error:", error);
      
      let errorMessage = error.message || "Failed to fund task.";
      
      if (error.code === 4001 || errorMessage.includes("rejected") || errorMessage.includes("denied")) {
        errorMessage = "You rejected the transaction. Please try again.";
      }
      
      toast({
        title: "Funding failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleCountry = (country: string) => {
    setSelectedCountries(prev => 
      prev.includes(country) ? prev.filter(c => c !== country) : [...prev, country]
    );
  };

  if (authLoading || !profile) {
    return null;
  }

  const isVideo = mediaFile?.type.startsWith('video/');
  const CategoryIcon = TASK_CATEGORIES.find(c => c.value === formData.category)?.icon || Image;

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className={`flex items-center gap-2 ${step === "create" ? "text-primary" : "text-green-600"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === "create" ? "bg-primary text-white" : "bg-green-600 text-white"}`}>
              {step === "create" ? "1" : <CheckCircle className="w-5 h-5" />}
            </div>
            <span className="font-medium">Create</span>
          </div>
          <div className="w-16 h-0.5 bg-border" />
          <div className={`flex items-center gap-2 ${step === "fund" ? "text-primary" : "text-muted-foreground"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === "fund" ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
              2
            </div>
            <span className="font-medium">Fund</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-display font-bold">
              {step === "create" ? "Create New Task" : "Fund Task"}
            </h1>
            <p className="text-muted-foreground">
              {step === "create" ? "Post a task for workers to complete" : "Add funds to activate your task"}
            </p>
          </div>
        </div>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>
              {step === "create" ? "Task Details" : "Funding Summary"}
            </CardTitle>
            <CardDescription>
              {step === "create" ? "Provide clear instructions for the best results" : "Review and fund your task"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === "create" ? (
              <form onSubmit={(e) => { e.preventDefault(); handleCreateTask(); }} className="space-y-6">
                {/* Category */}
                <div className="space-y-2">
                  <Label>Task Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TASK_CATEGORIES.map((cat) => {
                        const Icon = cat.icon;
                        return (
                          <SelectItem key={cat.value} value={cat.value}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              {cat.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Task Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Label 100 product images"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what this task involves..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    required
                  />
                </div>

                {/* Instructions */}
                <div className="space-y-2">
                  <Label htmlFor="instructions">Detailed Instructions</Label>
                  <Textarea
                    id="instructions"
                    placeholder="Step-by-step instructions for completing the task..."
                    value={formData.instructions}
                    onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                    rows={4}
                    required
                  />
                </div>

                {/* Workers & Payout */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="workers">Workers Needed</Label>
                    <Input
                      id="workers"
                      type="number"
                      min="1"
                      max="100"
                      value={formData.requiredWorkers}
                      onChange={(e) => setFormData({ ...formData, requiredWorkers: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payout">Payout per Worker (ETH)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">Ξ</span>
                      <Input
                        id="payout"
                        type="number"
                        step="0.001"
                        min="0.001"
                        className="pl-8"
                        placeholder="0.01"
                        value={formData.payoutPerWorker}
                        onChange={(e) => setFormData({ ...formData, payoutPerWorker: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Cost Preview */}
                {formData.payoutPerWorker && formData.requiredWorkers && (
                  <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <div className="flex justify-between items-center">
                      <span>Estimated Total</span>
                      <div className="flex items-center gap-2">
                        <img src="https://cryptologos.cc/logos/ethereum-eth-logo.png" alt="ETH" className="h-5 w-5" />
                        <span className="text-xl font-bold">
                          {totalCost.toFixed(4)} ETH
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formData.payoutPerWorker} ETH × {formData.requiredWorkers} workers + {platformFee.toFixed(4)} ETH fee
                    </p>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Continue to Funding
                    </>
                  )}
                </Button>
              </form>
            ) : (
              <div className="space-y-6">
                {/* Task Summary */}
                <div className="p-4 rounded-lg bg-muted/50">
                  <h3 className="font-semibold mb-3">{createdTask?.title}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Category</span>
                      <span>{createdTask?.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Payout/Worker</span>
                      <span>{payoutETH} ETH</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Workers</span>
                      <span>{workers}</span>
                    </div>
                    <hr />
                    <div className="flex justify-between items-center">
                      <span>Subtotal</span>
                      <div className="flex items-center gap-1">
                        <img src="https://cryptologos.cc/logos/ethereum-eth-logo.png" alt="ETH" className="h-4 w-4" />
                        <span>{subtotal.toFixed(4)} ETH</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Platform Fee (15%)</span>
                      <div className="flex items-center gap-1">
                        <img src="https://cryptologos.cc/logos/ethereum-eth-logo.png" alt="ETH" className="h-4 w-4" />
                        <span>{platformFee.toFixed(4)} ETH</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center font-bold text-lg">
                      <span>Total Required</span>
                      <div className="flex items-center gap-1">
                        <img src="https://cryptologos.cc/logos/ethereum-eth-logo.png" alt="ETH" className="h-5 w-5" />
                        <span className="text-primary">{totalCost.toFixed(4)} ETH</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Wallet Connection */}
                {!walletConnected ? (
                  <div className="p-4 rounded-lg border border-amber-500/50 bg-amber-500/10">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="h-5 w-5 text-amber-500" />
                      <div>
                        <p className="font-medium">Connect your wallet</p>
                        <p className="text-sm text-muted-foreground">
                          You need to connect your wallet to fund the task
                        </p>
                      </div>
                    </div>
                    <Button onClick={connectWallet} className="w-full mt-4">
                      <Wallet className="mr-2 h-4 w-4" />
                      Connect Wallet
                    </Button>
                  </div>
                ) : (
                  <div className="p-4 rounded-lg border border-green-500/50 bg-green-500/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Wallet Connected</p>
                        <p className="text-sm text-muted-foreground">
                          {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
                        </p>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="flex items-center gap-2 justify-end">
                          <img src="https://cryptologos.cc/logos/usd-coin-usdc-logo.png" alt="USDC" className="h-4 w-4" />
                          <p className="font-bold">{usdcBalance} {usdcSymbol}</p>
                        </div>
                        <div className="flex items-center gap-2 justify-end">
                          <img src="https://cryptologos.cc/logos/ethereum-eth-logo.png" alt="ETH" className="h-4 w-4" />
                          <p className="font-bold">{ethBalance} {ethSymbol}</p>
                        </div>
                        <p className={`text-sm ${hasEnoughBalance ? "text-green-600" : "text-red-500"}`}>
                          {hasEnoughBalance ? "✓ Sufficient" : "Insufficient"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setStep("create")}
                    className="flex-1"
                    disabled={loading}
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleFundTask}
                    className="flex-1"
                    disabled={loading || !walletConnected || !hasEnoughBalance}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        Fund with ETH
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
