"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Zap, DollarSign, Globe } from "lucide-react";
import { GeometricBackground, NdebeleBorder, ClawDivider, CornerAccent } from "@/components/ui/GeometricBackground";
import { DataRandLogo, TaskIcon, ShieldIcon, WorkIcon, PowerIcon, ArrowRightIcon, StrengthIcon } from "@/components/icons/DataRandIcons";
import SignUpButton from "@/components/ui/signupButton";

export default function Auth() {
  const { user, loading: authLoading, profile } = useAuth();
  const router = useRouter();

  // Redirect if already authenticated and profile is loaded
  useEffect(() => {
    if (!authLoading && user && profile) {
      // Redirect existing users based on their role
      if (profile.role === "client") {
        router.push("/client/tasks");
      } else {
        router.push("/tasks");
      }
    }
  }, [user, authLoading, profile, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <DataRandLogo size={64} className="text-primary animate-pulse" />
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (user && profile) {
    return null; // Or a loading spinner, as useEffect will redirect
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row relative overflow-hidden">
      {/* Left Side - Branding */}
      <div className="lg:flex-1 bg-card p-8 lg:p-12 flex flex-col justify-center relative">
        <GeometricBackground variant="ndebele" opacity={0.04} />
        <CornerAccent position="top-left" className="opacity-20" />
        <CornerAccent position="bottom-right" className="opacity-20" />

        <div className="max-w-lg mx-auto lg:mx-0 relative z-10">
          <div className="flex items-center gap-4 mb-10">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary shadow-glow">
              <DataRandLogo size={42} className="text-primary-foreground" />
            </div>
            <div>
              <span className="font-display text-4xl font-bold text-gradient-primary">
                DataRand
              </span>
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                African Intelligence Layer
              </p>
            </div>
          </div>

          <h1 className="text-3xl lg:text-4xl font-display font-bold mb-4 leading-tight">
            One Platform, Infinite Opportunities
          </h1>
          <p className="text-muted-foreground text-lg mb-10">
            Whether you're here to earn by completing tasks or to post jobs for our community, you're in the right place. DataRand is a unified platform for both contributing and creating.
          </p>

          <ClawDivider className="mb-10 opacity-30" />

          <div className="grid gap-5">
            <div className="flex items-start gap-4 p-5 rounded-xl bg-background/50 border border-border hover:border-primary/30 transition-all group">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <PowerIcon size={24} className="text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">Earn Instantly</h3>
                <p className="text-sm text-muted-foreground">Complete micro-tasks based on your knowledge and get paid. No resume needed.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-5 rounded-xl bg-background/50 border border-border hover:border-secondary/30 transition-all group">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary/10 group-hover:bg-secondary/20 transition-colors">
                <WorkIcon size={24} className="text-secondary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1 group-hover:text-secondary transition-colors">Create Tasks</h3>
                <p className="text-sm text-muted-foreground">Need data, insights, or content? Post tasks and leverage the power of our diverse community.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-5 rounded-xl bg-background/50 border border-border hover:border-accent/30 transition-all group">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10 group-hover:bg-accent/20 transition-colors">
                <StrengthIcon size={24} className="text-accent" />
              </div>
              <div>
                <h3 className="font-semibold mb-1 group-hover:text-accent transition-colors">Fuel Education</h3>
                <p className="text-sm text-muted-foreground">A portion of all platform activity funds education for millions of African children. Ubuntu in action.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="lg:flex-1 p-8 lg:p-12 flex items-center justify-center relative">
        <GeometricBackground variant="claws" opacity={0.03} />
        
        <Card className="w-full max-w-md border-border/50 shadow-card relative overflow-hidden">
          <NdebeleBorder />
          <CardHeader className="text-center pt-12">
            <CardTitle className="text-2xl font-display">
              Join the Arena
            </CardTitle>
            <CardDescription>
              Sign up once. Earn and create tasks from a single account.
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-12 flex flex-col items-center pt-8">
            <div className="relative w-full h-16 mb-8 overflow-hidden">
              <div className="absolute inset-0 flex animate-slide-cards">
                <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20 min-w-full">
                  <Zap className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium text-primary">Quick Setup</span>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary/5 border border-secondary/20 min-w-full">
                  <DollarSign className="h-5 w-5 text-secondary" />
                  <span className="text-sm font-medium text-secondary">Instant Earnings</span>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-lg bg-accent/5 border border-accent/20 min-w-full">
                  <Globe className="h-5 w-5 text-accent" />
                  <span className="text-sm font-medium text-accent">Global Impact</span>
                </div>
              </div>
            </div>
            <SignUpButton />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
