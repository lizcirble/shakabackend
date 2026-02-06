"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  EducationIcon, 
  GlobalSouthIcon,
  ChildrenIcon,
  EarningsIcon 
} from "@/components/icons/DataRandIcons";
import { Heart, TrendingUp, Users } from "lucide-react";
import { GeometricBackground, NdebeleBorder, CornerAccent } from "@/components/ui/GeometricBackground";
import { DonationCard } from "@/components/donations/DonationCard";
import { ImpactMetrics } from "@/components/impact/ImpactMetrics";

const COST_PER_CHILD = 15; // $15 to educate one child
const OUT_OF_SCHOOL_CHILDREN = 98000000; // ~98 million in Africa + India

interface RegionStats {
  region: string;
  total_raised: number;
  children_enrolled: number;
}

export default function EducationImpact() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [globalStats, setGlobalStats] = useState({
    totalRaised: 0,
    childrenEnrolled: 0,
  });
  const [regionStats, setRegionStats] = useState<RegionStats[]>([]);
  const [loading, setLoading] = useState(true);

  // Handle donation success/cancel
  useEffect(() => {
    if (!searchParams) return;
    
    const donationStatus = searchParams.get("donation");
    const amount = searchParams.get("amount");
    const children = searchParams.get("children");

    if (donationStatus === "success" && amount && children) {
      toast({
        title: "Thank you for your donation! 🎉",
        description: `You've funded education for ${children} ${Number(children) === 1 ? 'child' : 'children'}. You're changing lives!`,
      });
    } else if (donationStatus === "cancelled") {
      toast({
        title: "Donation cancelled",
        description: "No worries - you can donate anytime.",
        variant: "default",
      });
    }
  }, [searchParams, toast]);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const { data } = await supabase
          .from("education_fund_stats")
          .select("*");

        if (data) {
          const global = data.find(d => d.region === "global");
          if (global) {
            setGlobalStats({
              totalRaised: Number(global.total_raised) || 0,
              childrenEnrolled: global.children_enrolled || 0,
            });
          }
          setRegionStats(data.filter(d => d.region !== "global"));
        }
      } catch (err) {
        console.error("Error fetching stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const childrenRemaining = OUT_OF_SCHOOL_CHILDREN - globalStats.childrenEnrolled;
  const progressPercent = (globalStats.childrenEnrolled / OUT_OF_SCHOOL_CHILDREN) * 100;

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-64" />
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 relative">
        <GeometricBackground variant="dots" />
        
        {/* Header */}
        <div className="relative">
          <CornerAccent position="top-left" />
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-secondary to-primary">
              <EducationIcon size={28} className="text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold flex items-center gap-2">
                Education Impact
                <Heart className="h-5 w-5 text-red-500 fill-red-500" />
              </h1>
              <p className="text-muted-foreground">
                Global South Intelligence Layer for Education
              </p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="donate">Donate</TabsTrigger>
            <TabsTrigger value="impact">Impact Stories</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Hero Stats Card */}
            <Card className="border-2 border-secondary/30 bg-gradient-to-br from-secondary/10 via-transparent to-primary/5 overflow-hidden">
              <NdebeleBorder />
              <CardContent className="py-8">
                <div className="text-center mb-8">
                  <p className="text-sm text-muted-foreground mb-2">Total Funds Raised</p>
                  <p className="text-6xl font-display font-bold text-secondary">
                    ${globalStats.totalRaised.toLocaleString()}
                  </p>
                  <p className="text-lg text-muted-foreground mt-2">
                    From ComputeShare (15%) + Direct Donations
                  </p>
                </div>

                <div className="grid gap-6 md:grid-cols-3 mt-8">
                  <div className="text-center p-6 rounded-2xl bg-background/50 border border-secondary/20">
                    <ChildrenIcon size={40} className="mx-auto mb-3 text-primary" />
                    <p className="text-4xl font-display font-bold text-primary">
                      {globalStats.childrenEnrolled.toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">Children Enrolled</p>
                  </div>
                  <div className="text-center p-6 rounded-2xl bg-background/50 border border-orange-500/20">
                    <Users size={40} className="mx-auto mb-3 text-orange-500" />
                    <p className="text-4xl font-display font-bold text-orange-500">
                      {(childrenRemaining / 1000000).toFixed(1)}M
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">Still Need Education</p>
                  </div>
                  <div className="text-center p-6 rounded-2xl bg-background/50 border border-green-500/20">
                    <EarningsIcon size={40} className="mx-auto mb-3 text-green-500" />
                    <p className="text-4xl font-display font-bold text-green-500">
                      ${COST_PER_CHILD}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">Cost Per Child/Year</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Progress Section */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Progress Toward Universal Education
                </CardTitle>
                <CardDescription>
                  Our mission: Educate {(OUT_OF_SCHOOL_CHILDREN / 1000000).toFixed(0)} million out-of-school children
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">
                      {globalStats.childrenEnrolled.toLocaleString()} enrolled
                    </span>
                    <span className="text-muted-foreground">
                      {progressPercent.toFixed(6)}% of goal
                    </span>
                  </div>
                  <Progress value={Math.max(progressPercent, 0.01)} className="h-4" />
                  <p className="text-sm text-center text-muted-foreground">
                    {childrenRemaining.toLocaleString()} children still waiting for education
                  </p>
                </div>

                {/* Milestones */}
                <div className="grid gap-3 md:grid-cols-4">
                  {[100, 1000, 10000, 100000].map((milestone) => (
                    <div 
                      key={milestone}
                      className={`p-3 rounded-lg border text-center ${
                        globalStats.childrenEnrolled >= milestone 
                          ? "bg-primary/10 border-primary" 
                          : "border-border/50"
                      }`}
                    >
                      <p className={`font-bold ${
                        globalStats.childrenEnrolled >= milestone ? "text-primary" : ""
                      }`}>
                        {milestone.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">children</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Regional Breakdown */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="border-border/50 overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-orange-500 to-yellow-500" />
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center text-2xl">
                      🌍
                    </div>
                    <div>
                      <CardTitle>Africa</CardTitle>
                      <CardDescription>Sub-Saharan focus</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Out-of-school children</span>
                    <span className="font-bold text-orange-500">~60 million</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Children enrolled by DataRand</span>
                    <span className="font-bold text-primary">
                      {regionStats.find(r => r.region === "africa")?.children_enrolled || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Funds raised</span>
                    <span className="font-bold">
                      ${(regionStats.find(r => r.region === "africa")?.total_raised || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-orange-500/5 text-sm">
                    <p className="font-medium mb-1">Key Regions:</p>
                    <p className="text-muted-foreground">
                      Nigeria, Kenya, South Africa, Ghana, Ethiopia, Uganda
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-green-500 to-emerald-500" />
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center text-2xl">
                      🇮🇳
                    </div>
                    <div>
                      <CardTitle>India</CardTitle>
                      <CardDescription>Rural & urban outreach</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Out-of-school children</span>
                    <span className="font-bold text-green-500">~38 million</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Children enrolled by DataRand</span>
                    <span className="font-bold text-primary">
                      {regionStats.find(r => r.region === "india")?.children_enrolled || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Funds raised</span>
                    <span className="font-bold">
                      ${(regionStats.find(r => r.region === "india")?.total_raised || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-green-500/5 text-sm">
                    <p className="font-medium mb-1">Key States:</p>
                    <p className="text-muted-foreground">
                      Bihar, Uttar Pradesh, Rajasthan, Madhya Pradesh
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="donate" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <DonationCard />
              
              {/* Why Donate */}
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>Why Donate?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-secondary font-bold">
                      1
                    </div>
                    <div>
                      <p className="font-medium">100% Direct Impact</p>
                                        <p className="text-sm text-muted-foreground">
                                          Every dollar goes directly to education programs - no overhead
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex gap-3">
                                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-secondary font-bold">
                                        2
                                      </div>
                                      <div>
                                        <p className="font-medium">Verified Partners</p>
                                        <p className="text-sm text-muted-foreground">
                                          We work with established schools and NGOs in Africa &amp; India
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex gap-3">
                                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-secondary font-bold">
                                        3
                                      </div>
                                      <div>
                                        <p className="font-medium">Transparent Tracking</p>
                                        <p className="text-sm text-muted-foreground">
                                          See exactly where funds go and the impact they create
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex gap-3">
                                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-secondary font-bold">
                                        4
                                      </div>
                                      <div>
                                        <p className="font-medium">Break the Cycle</p>
                                        <p className="text-sm text-muted-foreground">
                                          Education is the most effective way to break the poverty cycle
                                        </p>
                                      </div>
                                    </div>                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="impact" className="space-y-6">
            <ImpactMetrics />
          </TabsContent>
        </Tabs>

        {/* Call to Action */}
        <Card className="border-primary/30 bg-gradient-to-r from-primary/10 to-secondary/10">
          <CardContent className="py-8 text-center">
            <GlobalSouthIcon size={48} className="mx-auto mb-4 text-primary" />
            <h3 className="text-2xl font-display font-bold mb-2">
              Join the Global South Intelligence Layer
            </h3>
            <p className="text-muted-foreground max-w-lg mx-auto mb-6">
              Every task completed, every compute cycle shared - 15% goes directly to educating 
              children in Africa and India. Together, we're building AI that gives back.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10">
                <span className="text-primary font-bold">${COST_PER_CHILD}</span>
                <span className="text-sm text-muted-foreground">= 1 child's education</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10">
                <span className="text-secondary font-bold">15%</span>
                <span className="text-sm text-muted-foreground">of platform earnings</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
