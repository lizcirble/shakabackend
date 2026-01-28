"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Zap, Users, Coins } from "lucide-react";
import { GeometricBackground, NdebeleBorder, ClawDivider, CornerAccent } from "@/components/ui/GeometricBackground";
import { DataRandLogo, TaskIcon, StrengthIcon } from "@/components/icons/DataRandIcons";
import SignUpButton from "@/components/ui/signupButton";

export default function Auth() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user && profile) {
      router.push("/tasks");
    }
  }, [user, profile, authLoading, router]);

  if (authLoading || (user && !profile)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <DataRandLogo size={64} className="text-primary animate-pulse" />
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          {user && (
            <p className="text-sm text-muted-foreground animate-pulse">
              Setting up your profile...
            </p>
          )}
        </div>
      </div>
    );
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
            Your Platform for Earning and Creating
          </h1>
          <p className="text-muted-foreground text-lg mb-10">
            One account. Complete freedom. Earn from tasks or create your own switch between both whenever you want. No barriers, no separate roles, just seamless opportunity.
          </p>

          <ClawDivider className="mb-10 opacity-30" />

          <div className="grid gap-5">
            <div className="flex items-start gap-4 p-5 rounded-xl bg-background/50 border border-border hover:border-primary/30 transition-all group">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Coins size={24} className="text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">Earn Instantly</h3>
                <p className="text-sm text-muted-foreground">Browse available tasks, contribute your knowledge, and get paid. Start earning from day one.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-5 rounded-xl bg-background/50 border border-border hover:border-secondary/30 transition-all group">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary/10 group-hover:bg-secondary/20 transition-colors">
                <TaskIcon size={24} className="text-secondary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1 group-hover:text-secondary transition-colors">Create Tasks</h3>
                <p className="text-sm text-muted-foreground">Need data, insights, or content? Post tasks for the community. Same account, same interface.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-5 rounded-xl bg-background/50 border border-border hover:border-accent/30 transition-all group">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10 group-hover:bg-accent/20 transition-colors">
                <Users size={24} className="text-accent" />
              </div>
              <div>
                <h3 className="font-semibold mb-1 group-hover:text-accent transition-colors">Complete Flexibility</h3>
                <p className="text-sm text-muted-foreground">Switch between earning and creating whenever you want. No limitations, no restrictions.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-5 rounded-xl bg-background/50 border border-border hover:border-primary/30 transition-all group">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <StrengthIcon size={24} className="text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">Power Education</h3>
                <p className="text-sm text-muted-foreground">Every task you complete or create helps fund education for African children. Ubuntu in action.</p>
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
              Join DataRand Today
            </CardTitle>
            <CardDescription>
              One account for everything—earn from tasks, create tasks, or do both.
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
                  <Coins className="h-5 w-5 text-secondary" />
                  <span className="text-sm font-medium text-secondary">Instant Earning</span>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-lg bg-accent/5 border border-accent/20 min-w-full">
                  <TaskIcon className="h-5 w-5 text-accent" />
                  <span className="text-sm font-medium text-accent">Create Freely</span>
                </div>
              </div>
            </div>
            
            <div className="w-full space-y-4 mb-6">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <div className="h-px flex-1 bg-border"></div>
                <span>What you can do</span>
                <div className="h-px flex-1 bg-border"></div>
              </div>
              
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Coins className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>Complete tasks and earn immediately</span>
                </li>
                <li className="flex items-start gap-2">
                  <TaskIcon className="h-4 w-4 text-secondary mt-0.5 shrink-0" />
                  <span>Post your own tasks for the community</span>
                </li>
                <li className="flex items-start gap-2">
                  <Users className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                  <span>Switch between both anytime</span>
                </li>
              </ul>
            </div>
            
            <SignUpButton />
            
            <p className="text-xs text-center text-muted-foreground mt-6">
              By signing up, you agree to our Terms of Service and Privacy Policy
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}