"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ComputeIcon, EducationIcon, EarningsIcon, GlobalSouthIcon, TrendingIcon } from "@/components/icons/DataRandIcons";
import { ChevronDown, Heart } from "lucide-react";
import { GeometricBackground, NdebeleBorder, CornerAccent } from "@/components/ui/GeometricBackground";
import { DeviceToggleCard } from "@/components/compute/DeviceToggleCard";

const COST_PER_CHILD = 13;
const OUT_OF_SCHOOL_CHILDREN = 98000000;

export default function ComputeShare() {
  const { profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  // Device-specific states
  const [phoneActive, setPhoneActive] = useState(false);
  const [laptopActive, setLaptopActive] = useState(false);
  const [phoneSessionId, setPhoneSessionId] = useState<string | null>(null);
  const [laptopSessionId, setLaptopSessionId] = useState<string | null>(null);
  const [phoneInstalled, setPhoneInstalled] = useState(false);
  const [laptopInstalled, setLaptopInstalled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<'phone' | 'laptop' | null>(null);
  
  const [stats, setStats] = useState({
    totalEarned: 0,
    sessionEarned: 0,
    phoneMinutes: 0,
    laptopMinutes: 0,
    educationContribution: 0
  });
  
  const [globalStats, setGlobalStats] = useState({
    totalRaised: 0,
    childrenEnrolled: 0
  });
  
  const [howItWorksOpen, setHowItWorksOpen] = useState(() => {
    const stored = localStorage.getItem('computeShare_howItWorksViewed');
    return stored !== 'true';
  });
  
  const phoneIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const laptopIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const phoneStartRef = useRef<Date | null>(null);
  const laptopStartRef = useRef<Date | null>(null);

  useEffect(() => {
    if (!authLoading && !profile) {
      router.push("/auth");
    }
  }, [authLoading, profile, router]);

  // Fetch initial stats
  useEffect(() => {
    if (!profile) return;
    
    const fetchStats = async () => {
      setLoading(true);
      try {
        // Fetch user's profile with device columns
        const { data: profileData } = await supabase
          .from("profiles")
          .select("compute_earnings, phone_compute_enabled, laptop_compute_enabled, phone_app_installed, laptop_software_installed")
          .eq("id", profile.id)
          .maybeSingle();
          
        if (profileData) {
          setStats(prev => ({
            ...prev,
            totalEarned: Number(profileData.compute_earnings) || 0
          }));
          setPhoneInstalled(profileData.phone_app_installed || false);
          // Auto-detect desktop browser and mark as installed
          const isDesktop = !/Mobi|Android/i.test(navigator.userAgent);
          setLaptopInstalled(profileData.laptop_software_installed || isDesktop);
          
          // If desktop browser, update DB
          if (isDesktop && !profileData.laptop_software_installed) {
            await supabase
              .from("profiles")
              .update({ laptop_software_installed: true })
              .eq("id", profile.id);
          }
        }

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

        // Check for active phone session
        const { data: phoneSession } = await supabase
          .from("compute_sessions")
          .select("*")
          .eq("worker_id", profile.id)
          .eq("device_type", "mobile")
          .eq("is_active", true)
          .maybeSingle();
          
        if (phoneSession) {
          setPhoneSessionId(phoneSession.id);
          phoneStartRef.current = new Date(phoneSession.started_at);
          setPhoneActive(true);
        }

        // Check for active laptop session
        const { data: laptopSession } = await supabase
          .from("compute_sessions")
          .select("*")
          .eq("worker_id", profile.id)
          .eq("device_type", "desktop")
          .eq("is_active", true)
          .maybeSingle();
          
        if (laptopSession) {
          setLaptopSessionId(laptopSession.id);
          laptopStartRef.current = new Date(laptopSession.started_at);
          setLaptopActive(true);
        }
      } catch (err) {
        console.error("Error fetching stats:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, [profile]);

  // Phone earnings timer
  useEffect(() => {
    if (phoneActive && phoneStartRef.current) {
      phoneIntervalRef.current = setInterval(() => {
        const now = new Date();
        const minutes = (now.getTime() - phoneStartRef.current!.getTime()) / 60000;
        setStats(prev => ({
          ...prev,
          phoneMinutes: Math.floor(minutes)
        }));
      }, 1000);
    } else {
      if (phoneIntervalRef.current) {
        clearInterval(phoneIntervalRef.current);
      }
    }
    return () => {
      if (phoneIntervalRef.current) clearInterval(phoneIntervalRef.current);
    };
  }, [phoneActive]);

  // Laptop earnings timer
  useEffect(() => {
    if (laptopActive && laptopStartRef.current) {
      laptopIntervalRef.current = setInterval(() => {
        const now = new Date();
        const minutes = (now.getTime() - laptopStartRef.current!.getTime()) / 60000;
        setStats(prev => ({
          ...prev,
          laptopMinutes: Math.floor(minutes)
        }));
      }, 1000);
    } else {
      if (laptopIntervalRef.current) {
        clearInterval(laptopIntervalRef.current);
      }
    }
    return () => {
      if (laptopIntervalRef.current) clearInterval(laptopIntervalRef.current);
    };
  }, [laptopActive]);

  // Calculate combined session earnings
  useEffect(() => {
    const phoneEarnings = phoneActive ? stats.phoneMinutes * 0.001 : 0;
    const laptopEarnings = laptopActive ? stats.laptopMinutes * 0.001 : 0;
    const totalSession = phoneEarnings + laptopEarnings;
    
    setStats(prev => ({
      ...prev,
      sessionEarned: totalSession,
      educationContribution: totalSession * 0.15
    }));
  }, [phoneActive, laptopActive, stats.phoneMinutes, stats.laptopMinutes]);

  const handleToggleDevice = async (device: 'phone' | 'laptop') => {
    if (!profile) return;
    
    const isPhone = device === 'phone';
    const isActive = isPhone ? phoneActive : laptopActive;
    const sessionId = isPhone ? phoneSessionId : laptopSessionId;
    const deviceType = isPhone ? 'mobile' : 'desktop';
    const minutes = isPhone ? stats.phoneMinutes : stats.laptopMinutes;
    
    setToggling(device);
    
    try {
      if (!isActive) {
        // Start session
        const { data: session, error } = await supabase
          .from("compute_sessions")
          .insert({
            worker_id: profile.id,
            device_type: deviceType,
            is_active: true
          })
          .select()
          .single();
          
        if (error) throw error;
        
        if (isPhone) {
          setPhoneSessionId(session.id);
          phoneStartRef.current = new Date();
          setPhoneActive(true);
          await supabase.from("profiles").update({ phone_compute_enabled: true }).eq("id", profile.id);
        } else {
          setLaptopSessionId(session.id);
          laptopStartRef.current = new Date();
          setLaptopActive(true);
          await supabase.from("profiles").update({ laptop_compute_enabled: true }).eq("id", profile.id);
        }
        
        toast({
          title: `${isPhone ? 'Phone' : 'Laptop'} Compute Started! 🚀`,
          description: "You're now earning from your idle resources. 15% goes to education."
        });
      } else {
        // End session
        if (sessionId) {
          const sessionEarnings = minutes * 0.001;
          const eduAmount = sessionEarnings * 0.15;
          const workerAmount = sessionEarnings * 0.85;
          
          await supabase
            .from("compute_sessions")
            .update({
              is_active: false,
              ended_at: new Date().toISOString(),
              total_earned: sessionEarnings
            })
            .eq("id", sessionId);

          if (workerAmount > 0) {
            await supabase.from("transactions").insert({
              profile_id: profile.id,
              amount: workerAmount,
              type: "earning",
              status: "completed",
              description: `ComputeShare ${isPhone ? 'phone' : 'laptop'} earnings (${minutes} min)`
            });

            await supabase.from("transactions").insert({
              profile_id: profile.id,
              amount: eduAmount,
              type: "education_fund",
              status: "completed",
              description: `ComputeShare education contribution (15%)`
            });
          }

          const newTotal = stats.totalEarned + workerAmount;
          await supabase
            .from("profiles")
            .update({
              compute_earnings: newTotal,
              ...(isPhone ? { phone_compute_enabled: false } : { laptop_compute_enabled: false })
            })
            .eq("id", profile.id);
            
          setStats(prev => ({
            ...prev,
            totalEarned: newTotal,
            ...(isPhone ? { phoneMinutes: 0 } : { laptopMinutes: 0 })
          }));
          
          toast({
            title: `${isPhone ? 'Phone' : 'Laptop'} Compute Stopped`,
            description: `You earned $${sessionEarnings.toFixed(4)} this session.`
          });
        }
        
        if (isPhone) {
          setPhoneSessionId(null);
          phoneStartRef.current = null;
          setPhoneActive(false);
        } else {
          setLaptopSessionId(null);
          laptopStartRef.current = null;
          setLaptopActive(false);
        }
      }
    } catch (err) {
      console.error("Error toggling compute:", err);
      toast({
        title: "Error",
        description: "Failed to toggle compute sharing. Please try again.",
        variant: "destructive"
      });
    } finally {
      setToggling(null);
    }
  };

  // Collapse "How it works" after viewing
  useEffect(() => {
    if (!howItWorksOpen) {
      localStorage.setItem('computeShare_howItWorksViewed', 'true');
    }
  }, [howItWorksOpen]);

  const childrenRemaining = OUT_OF_SCHOOL_CHILDREN - globalStats.childrenEnrolled;
  const progressPercent = (globalStats.childrenEnrolled / OUT_OF_SCHOOL_CHILDREN) * 100;
  
  if (authLoading) return null;
  
  return (
    <AppLayout>
      <div className="space-y-6 relative">
        <GeometricBackground variant="dots" />
        
        {/* Header */}
        <div className="relative">
          <CornerAccent position="top-left" />
          <div className="flex items-center gap-3">
            <ComputeIcon size={32} className="text-primary" />
            <div>
              <h1 className="text-2xl font-display font-bold">ComputeShare</h1>
              <p className="text-muted-foreground">Make money from your idle computer or phone</p>
            </div>
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
                ${stats.sessionEarned.toFixed(4)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                $0.001/min while active
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
                ${stats.totalEarned.toFixed(4)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Lifetime compute earnings
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
                ${stats.educationContribution.toFixed(4)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                15% of earnings fund education
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
              isEnabled={phoneActive}
              isInstalled={phoneInstalled}
              onToggle={() => handleToggleDevice('phone')}
              isLoading={toggling === 'phone'}
              sessionMinutes={stats.phoneMinutes}
            />
            <DeviceToggleCard
              deviceType="laptop"
              isEnabled={laptopActive}
              isInstalled={laptopInstalled}
              onToggle={() => handleToggleDevice('laptop')}
              isLoading={toggling === 'laptop'}
              sessionMinutes={stats.laptopMinutes}
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

export async function getServerSideProps() {
  return {
    props: {}
  };
}
