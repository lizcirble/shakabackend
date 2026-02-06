"use client"

import { AppLayout } from "@/components/layout/AppLayout";
import withAuth from "@/components/withAuth";
import { useAuth } from "@/hooks/useAuth";
import { useLocalTasks } from "@/hooks/useLocalTasks";
import { useGlobalMetrics } from "@/hooks/useGlobalMetrics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileAvatar } from "@/components/ui/profile-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart, DollarSign, CheckCircle, Star, Zap, Activity, Cpu, FileText, GraduationCap, Users } from "lucide-react";
import { DailyImpactCard } from "@/components/DailyImpactCard";
import { Progress } from "@/components/ui/progress";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

function ProfilePageContent() {
  const { profile } = useAuth();
  const { getTasksByClientId } = useLocalTasks();
  const router = useRouter();
  const {
    tasksCompletedToday,
    dataProcessedToday,
    earnedToday,
    totalEarnings,
    totalTasksCompleted,
    currentCpuUsage,
    educationFundContribution,
    studentsImpacted
  } = useGlobalMetrics();

  const userTasks = profile ? getTasksByClientId(profile.id) : [];

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
              <div className="text-xl sm:text-2xl font-bold">${totalEarnings.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{totalTasksCompleted}</div>
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

        {/* Created Tasks */}
        {userTasks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <FileText className="h-5 w-5" /> My Created Tasks
              </CardTitle>
              <CardDescription>
                Tasks you&apos;ve created for the community
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {userTasks.slice(0, 5).map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{task.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        ${task.payout_amount} • {task.estimated_time_minutes} min • {task.worker_count} workers
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={task.status === 'available' ? 'default' : 'secondary'} className="text-xs">
                        {task.status}
                      </Badge>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => router.push(`/client/tasks/${task.id}`)}
                      >
                        View
                      </Button>
                    </div>
                  </div>
                ))}
                {userTasks.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center pt-2">
                    +{userTasks.length - 5} more tasks
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

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
              Complete more tasks accurately to advance to &apos;Verified&apos; and &apos;Expert&apos; tiers, unlocking higher-value work.
            </p>
          </CardContent>
        </Card>

        {/* Daily Impact Cards */}
        <DailyImpactCard />

      </div>
    </AppLayout>
  );
}

const ProfilePage = withAuth(ProfilePageContent);
export default ProfilePage;
