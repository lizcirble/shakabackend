"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import withAuth from "@/components/withAuth";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileAvatar } from "@/components/ui/profile-avatar";
import { Badge } from "@/components/ui/badge";
import { BarChart, DollarSign, CheckCircle, Star, Zap, Activity, Cpu, Gpu } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useState, useEffect } from "react";

function ProfilePageContent() {
  const { profile } = useAuth();
  const [cpuUsage, setCpuUsage] = useState(0);
  const [gpuUsage, setGpuUsage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCpuUsage(Math.floor(Math.random() * 100));
      setGpuUsage(Math.floor(Math.random() * 100));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AppLayout>
      <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
        {/* Profile Header */}
        <Card className="overflow-hidden">
          <CardHeader className="p-0">
            <div className="h-16 sm:h-24 bg-gradient-to-r from-primary/20 to-secondary/20" />
          </CardHeader>
          <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-start gap-4 sm:gap-6 -mt-8 sm:-mt-12">
            <ProfileAvatar
              src={profile?.avatar_url}
              name={profile?.full_name}
              email={profile?.email}
              size="xl"
              className="border-4 border-background ring-2 ring-primary mx-auto sm:mx-0"
            />
            <div className="pt-8 sm:pt-12 text-center sm:text-left w-full sm:w-auto">
              <h1 className="text-xl sm:text-2xl font-bold">{profile?.full_name}</h1>
              <p className="text-muted-foreground text-sm sm:text-base">{profile?.email}</p>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">${profile?.total_earnings.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{profile?.tasks_completed}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Reputation Score</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{profile?.reputation_score}</div>
            </CardContent>
          </Card>
        </div>

        {/* Skill Progression */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <BarChart className="h-5 w-5" /> Skill Progression
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <p className="text-muted-foreground text-sm sm:text-base">Your current skill tier is:</p>
            <Badge className="text-base sm:text-lg px-3 py-1" variant="secondary">Beginner</Badge>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Complete more tasks accurately to advance to 'Verified' and 'Expert' tiers, unlocking higher-value work.
            </p>
          </CardContent>
        </Card>

        {/* Daily Impact Cards */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Zap className="h-5 w-5" /> Daily Impact
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col items-center justify-center p-4 bg-muted/50 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-500 mb-2" />
              <p className="text-lg font-bold">5</p>
              <p className="text-sm text-muted-foreground">Tasks Completed</p>
            </div>
            <div className="flex flex-col items-center justify-center p-4 bg-muted/50 rounded-lg">
              <Activity className="h-6 w-6 text-blue-500 mb-2" />
              <p className="text-lg font-bold">1.2 GB</p>
              <p className="text-sm text-muted-foreground">Data Processed</p>
            </div>
            <div className="flex flex-col items-center justify-center p-4 bg-muted/50 rounded-lg">
              <DollarSign className="h-6 w-6 text-yellow-500 mb-2" />
              <p className="text-lg font-bold">$3.45</p>
              <p className="text-sm text-muted-foreground">Earned Today</p>
            </div>
          </CardContent>
        </Card>

        {/* Live Resource Transparency */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Activity className="h-5 w-5" /> Live Resource Transparency
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Cpu className="h-5 w-5 text-muted-foreground" />
                  <p className="text-sm font-medium">CPU Usage</p>
                </div>
                <p className="text-sm text-muted-foreground">{cpuUsage}%</p>
              </div>
              <Progress value={cpuUsage} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Gpu className="h-5 w-5 text-muted-foreground" />
                  <p className="text-sm font-medium">GPU Usage</p>
                </div>
                <p className="text-sm text-muted-foreground">{gpuUsage}%</p>
              </div>
              <Progress value={gpuUsage} className="h-2" />
            </div>
            <p className="text-xs text-muted-foreground">
              Real-time view of your device's contribution when compute sharing is active.
            </p>
          </CardContent>
        </Card>

      </div>
    </AppLayout>
  );
}

const ProfilePage = withAuth(ProfilePageContent);
export default ProfilePage;
