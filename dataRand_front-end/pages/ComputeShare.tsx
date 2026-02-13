"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { useComputeDevices } from "@/hooks/useComputeDevices";
import { supabase } from "@/lib/supabase";
import { useWalletBalance } from "@/hooks/useWalletBalance";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ComputeIcon, EducationIcon, EarningsIcon, GlobalSouthIcon, TrendingIcon } from "@/components/icons/DataRandIcons";
import { ChevronDown, Heart } from "lucide-react";
import { GeometricBackground, NdebeleBorder, CornerAccent } from "@/components/ui/GeometricBackground";
import { DeviceToggleCard } from "@/components/compute/DeviceToggleCard";

const COST_PER_CHILD = 13;
const OUT_OF_SCHOOL_CHILDREN = 98000000;
const ARBITRUM_SEPOLIA_CHAIN_ID = 421614;

export default function ComputeShare() {
  const { profile, loading: authLoading } = useAuth();
  const { phoneState, laptopState, loading: devicesLoading, toggling, toggleDevice, currentDevice } = useComputeDevices();
  const router = useRouter();
  const { balance: walletBalance, symbol: walletSymbol } = useWalletBalance(ARBITRUM_SEPOLIA_CHAIN_ID);
  
  const [stats, setStats] = useState({
    totalEarned: 0,
    sessionEarned: 0,
    educationContribution: 0,
    earningsRate: 0
  });
  
  const [globalStats, setGlobalStats] = useState({
    totalRaised: 0,
    childrenEnrolled: 0
  });
  
  const [howItWorksOpen, setHowItWorksOpen] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('computeShare_howItWorksViewed');
    // eslint-disable-next-line react-hooks/exhaustive-deps
    setHowItWorksOpen(stored !== 'true');
  }, []);

  useEffect(() => {
    if (!authLoading && !profile) {
      router.push("/auth");
    }
  }, [authLoading, profile, router]);

  // Fetch real persisted compute stats from DB.
  useEffect(() => {
    if (!profile) return;
    
    const fetchStats = async () => {
      try {
        const { data: sessionsData } = await supabase
          .from("compute_sessions")
          .select("total_earned, earnings_rate")
          .eq("worker_id", profile.id)
          .order("started_at", { ascending: false });

        const totalEarned = (sessionsData || []).reduce(
          (sum, session) => sum + Number(session.total_earned || 0),
          0
        );
        const latestRate = Number(sessionsData?.[0]?.earnings_rate || 0);

        setStats(prev => ({
          ...prev,
          totalEarned,
          earningsRate: latestRate,
          educationContribution: totalEarned * 0.15
        }));

        // Fetch global education stats
        const { data: eduStats } = await supabase
          .from("education_fund_stats")
          .select("*")
          .eq("region", "global")
          .maybeSingle();
          
        if (eduStats) {
          setGlobalStats({
            totalRaised: Number(eduStats.total_raised) || 0,
            childrenEnrolled: eduStats.children_enrolled || 0
          });
        }
      } catch (err) {
        console.error("Error fetching stats:", err);
      }
    };
    
    fetchStats();
    const interval = setInterval(fetchStats, 15000);
    return () => clearInterval(interval);
  }, [profile]);

  // Live session estimate based on persisted earnings rate.
  useEffect(() => {
    const phoneEarnings = phoneState.isActive ? phoneState.sessionMinutes * stats.earningsRate : 0;
    const laptopEarnings = laptopState.isActive ? laptopState.sessionMinutes * stats.earningsRate : 0;
    const totalSession = phoneEarnings + laptopEarnings;

    setStats(prev => ({
      ...prev,
      sessionEarned: totalSession
    }));
  }, [
    phoneState.isActive,
    phoneState.sessionMinutes,
    laptopState.isActive,
    laptopState.sessionMinutes,
    stats.earningsRate
  ]);

  const handleToggleDevice = async (device: 'phone' | 'laptop') => {
    await toggleDevice(device);
  };

  // Collapse "How it works" after viewing
  useEffect(() => {
    if (!howItWorksOpen) {
      localStorage.setItem('computeShare_howItWorksViewed', 'true');
    }
  }, [howItWorksOpen]);

  const childrenRemaining = OUT_OF_SCHOOL_CHILDREN - globalStats.childrenEnrolled;
  const progressPercent = (globalStats.childrenEnrolled / OUT_OF_SCHOOL_CHILDREN) * 100;
  
  if (authLoading || devicesLoading) return null;
  
  return (
    <AppLayout>
      <div className="space-y-6 relative">
        <GeometricBackground variant="dots" />
        
        {/* Header */}
        <div className="relative">
          <CornerAccent position="top-left" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ComputeIcon size={32} className="text-primary" />
              <div>
                <h1 className="text-2xl font-display font-bold">ComputeShare</h1>
                <p className="text-muted-foreground">Make money from your idle computer or phone</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => router.push('/compute/history')}>
              View History
            </Button>
          </div>
        </div>

        {/* How It Works - Collapsible */}
        <Collapsible open={howItWorksOpen} onOpenChange={setHowItWorksOpen}>
          <Card className="border-border/50">
            <CollapsibleTrigger className="w-full">
              <CardHeader className="flex flex-row items-center justify-between py-4">
                <CardTitle className="text-lg">How ComputeShare Works</CardTitle>
                <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${howItWorksOpen ? 'rotate-180' : ''}`} />
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                      1
                    </div>
                    <div>
                      <p className="font-medium">Toggle On</p>
                      <p className="text-sm text-muted-foreground">
                        Enable compute sharing on your phone or laptop
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                      2
                    </div>
                    <div>
                      <p className="font-medium">Earn Passively</p>
                      <p className="text-sm text-muted-foreground">
                        We use your idle CPU/GPU for AI/ML workloads
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-secondary font-bold">
                      3
                    </div>
                    <div>
                      <p className="font-medium">Fund Education</p>
                      <p className="text-sm text-muted-foreground">
                        15% of earnings go to schooling in Africa & India
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Earnings Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-border/50 bg-gradient-to-br from-primary/10 to-transparent">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <EarningsIcon size={16} />
                Session Earnings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-display font-bold text-primary">
                {stats.sessionEarned.toFixed(6)} {walletSymbol}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.earningsRate > 0
                  ? `${stats.earningsRate.toFixed(6)} ${walletSymbol}/min (DB rate)`
                  : "Rate unavailable until first settled session"}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <TrendingIcon size={16} />
                Total Earned
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-display font-bold">
                {Number(walletBalance || 0).toFixed(6)} {walletSymbol}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Live Arbitrum Sepolia wallet balance
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-gradient-to-br from-secondary/10 to-transparent">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <EducationIcon size={16} />
                Your Education Contribution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-display font-bold text-secondary">
                {stats.educationContribution.toFixed(6)} {walletSymbol}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                15% of settled compute earnings
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Device Toggle Cards */}
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent overflow-hidden">
          <NdebeleBorder />
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Your Devices</CardTitle>
            <CardDescription>
              Toggle compute sharing for each device independently
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <DeviceToggleCard
              deviceType="phone"
              isEnabled={phoneState.isActive}
              onToggle={() => handleToggleDevice('phone')}
              isLoading={toggling === 'phone'}
              sessionMinutes={phoneState.sessionMinutes}
              demandStatus={phoneState.demandStatus}
              currentDevice={currentDevice}
              otherDeviceActive={laptopState.isActive}
            />
            <DeviceToggleCard
              deviceType="laptop"
              isEnabled={laptopState.isActive}
              onToggle={() => handleToggleDevice('laptop')}
              isLoading={toggling === 'laptop'}
              sessionMinutes={laptopState.sessionMinutes}
              demandStatus={laptopState.demandStatus}
              currentDevice={currentDevice}
              otherDeviceActive={phoneState.isActive}
            />
          </CardContent>
        </Card>

        {/* Education Impact Section */}
        <Card className="border-2 border-secondary/20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent pointer-events-none" />
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary/10">
                <Heart className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  Global South Education Fund
                  <GlobalSouthIcon size={20} className="text-secondary" />
                </CardTitle>
                <CardDescription>
                  Your compute power is educating children in Africa & India
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-3xl font-display font-bold text-secondary">
                  ${globalStats.totalRaised.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Total Raised</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-3xl font-display font-bold text-primary">
                  {globalStats.childrenEnrolled.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Children Enrolled</p>
                <p className="text-xs text-muted-foreground mt-1">@ ${COST_PER_CHILD}/child</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-3xl font-display font-bold text-orange-500">
                  {(childrenRemaining / 1000000).toFixed(1)}M
                </p>
                <p className="text-sm text-muted-foreground">Still Out of School</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress to universal education</span>
                <span className="font-medium">{progressPercent.toFixed(4)}%</span>
              </div>
              <Progress value={progressPercent} className="h-3" />
              <p className="text-xs text-center text-muted-foreground">
                Together, we can educate {(OUT_OF_SCHOOL_CHILDREN / 1000000).toFixed(0)} million children
              </p>
            </div>

            {/* Regional breakdown */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center gap-3 p-3 rounded-lg border border-border/50">
                <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <span className="text-lg">🌍</span>
                </div>
                <div>
                  <p className="font-medium">Africa</p>
                  <p className="text-xs text-muted-foreground">~60M out-of-school children</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg border border-border/50">
                <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                  <span className="text-lg">🇮🇳</span>
                </div>
                <div>
                  <p className="font-medium">India</p>
                  <p className="text-xs text-muted-foreground">~38M out-of-school children</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
