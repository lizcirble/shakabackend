"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { GeometricBackground, NdebeleBorder, ClawDivider, CornerAccent } from "@/components/ui/GeometricBackground";
import { DataRandLogo, TaskIcon, ShieldIcon, WorkIcon, PowerIcon, ArrowRightIcon, StrengthIcon } from "@/components/icons/DataRandIcons";
import SignUpButton from "@/components/ui/signupButton";
export default function Auth() {
  const {
    user,
    loading: authLoading,
    profile
  } = useAuth();
  const router = useRouter();
  const {
    toast
  } = useToast();
  const [role, setRole] = useState<"worker" | "client" | null>(null);

  // Redirect if already authenticated and profile is loaded
  useEffect(() => {
    if (!authLoading && user && profile) {
      if (profile.role === "worker") {
        router.push("/tasks");
      } else if (profile.role === "client") {
        router.push("/client/tasks");
      }
    }
  }, [user, authLoading, profile, router]);

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <DataRandLogo size={64} className="text-primary animate-pulse" />
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>;
  }

  // If user is already logged in and profile is loaded, but not redirected by useEffect yet,
  // this means the component is still rendering. We should not show the auth form.
  // This handles cases where the useEffect might not have completed its redirection
  // before the rest of the component renders.
  if (user && profile) {
    return null; // Or a loading spinner, but null is fine as useEffect will redirect
  }

  return <div className="min-h-screen flex flex-col lg:flex-row relative overflow-hidden">
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
            Unleash the Power of
            <span className="text-gradient-primary"> African Intelligence</span>
          </h1>
          <p className="text-muted-foreground text-lg mb-10">Turn your knowledge into income. Complete micro-tasks, earn real money, and power the future of AI compute, while funding education across Africa.</p>

          <ClawDivider className="mb-10 opacity-30" />

          <div className="grid gap-5">
            <div className="flex items-start gap-4 p-5 rounded-xl bg-background/50 border border-border hover:border-primary/30 transition-all group">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <TaskIcon size={24} className="text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">Instant Task Alerts</h3>
                <p className="text-sm text-muted-foreground">Get pinged with mini-tasks to complete in less than a minute. Accept with one tap like a true warrior.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-5 rounded-xl bg-background/50 border border-border hover:border-secondary/30 transition-all group">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary/10 group-hover:bg-secondary/20 transition-colors">
                <ShieldIcon size={24} className="text-secondary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1 group-hover:text-secondary transition-colors">Build Your Reputation</h3>
                <p className="text-sm text-muted-foreground">No degree or qualifications needed. Your knowledge of Africa is enough. Quality work builds your reputation score. Rise through the ranks and unlock better opportunities.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-5 rounded-xl bg-background/50 border border-border hover:border-accent/30 transition-all group">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10 group-hover:bg-accent/20 transition-colors">
                <StrengthIcon size={24} className="text-accent" />
              </div>
              <div>
                <h3 className="font-semibold mb-1 group-hover:text-accent transition-colors">Education Through ComputeShare</h3>
                <p className="text-sm text-muted-foreground">Share your device's idle compute power and 15% funds education for millions of African children. Ubuntu in action.</p>
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
          <CardHeader className="text-center pt-8">
            <CardTitle className="text-2xl font-display">
              Join the Pride
            </CardTitle>
            <CardDescription>
              Sign up to start your journey with DataRand.
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-8 flex flex-col items-center pt-6">
            <div className="space-y-3 mb-6">
              <Label>I want to...</Label>
              <RadioGroup value={role || ""} onValueChange={v => setRole(v as "worker" | "client")} className="grid grid-cols-2 gap-4">
                <Label htmlFor="role-worker" className={`flex flex-col items-center gap-3 rounded-xl border-2 p-5 cursor-pointer transition-all ${role === "worker" ? "border-primary bg-primary/5 shadow-glow" : "border-border hover:border-primary/50"}`}>
                  <RadioGroupItem value="worker" id="role-worker" className="sr-only" />
                  <PowerIcon size={28} className={role === "worker" ? "text-primary" : "text-muted-foreground"} />
                  <span className="font-semibold">Earn Money</span>
                  <span className="text-xs text-muted-foreground text-center">
                    Complete tasks
                  </span>
                </Label>
                <Label htmlFor="role-client" className={`flex flex-col items-center gap-3 rounded-xl border-2 p-5 cursor-pointer transition-all ${role === "client" ? "border-primary bg-primary/5 shadow-glow" : "border-border hover:border-primary/50"}`}>
                  <RadioGroupItem value="client" id="role-client" className="sr-only" />
                  <WorkIcon size={28} className={role === "client" ? "text-primary" : "text-muted-foreground"} />
                  <span className="font-semibold">Post Tasks</span>
                  <span className="text-xs text-muted-foreground text-center">
                    Get work done
                  </span>
                </Label>
              </RadioGroup>
            </div>
            <SignUpButton selectedRole={role} />
          </CardContent>
        </Card>
      </div>
    </div>;
}
