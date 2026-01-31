"use client";

import { useGlobalMetrics } from "@/hooks/useGlobalMetrics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle, 
  Activity, 
  DollarSign, 
  Cpu, 
  Clock, 
  GraduationCap, 
  Users, 
  Zap,
  TrendingUp,
  Globe
} from "lucide-react";

export function DailyImpactCard() {
  const {
    tasksCompletedToday,
    dataProcessedToday,
    earnedToday,
    totalEarnings,
    totalTasksCompleted,
    totalComputeSessions,
    totalComputeMinutes,
    currentCpuUsage,
    activeComputeSession,
    educationFundContribution,
    studentsImpacted
  } = useGlobalMetrics();

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Zap className="h-5 w-5" /> Daily Impact Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Today's Activity */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Today's Activity
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col items-center justify-center p-4 bg-muted/50 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-500 mb-2" />
              <p className="text-lg font-bold">{tasksCompletedToday}</p>
              <p className="text-sm text-muted-foreground">Tasks Completed</p>
            </div>
            <div className="flex flex-col items-center justify-center p-4 bg-muted/50 rounded-lg">
              <Activity className="h-6 w-6 text-blue-500 mb-2" />
              <p className="text-lg font-bold">{dataProcessedToday.toFixed(1)} GB</p>
              <p className="text-sm text-muted-foreground">Data Processed</p>
            </div>
            <div className="flex flex-col items-center justify-center p-4 bg-muted/50 rounded-lg">
              <DollarSign className="h-6 w-6 text-yellow-500 mb-2" />
              <p className="text-lg font-bold">${earnedToday.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">Earned Today</p>
            </div>
          </div>
        </div>

        {/* Overall Progress */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Overall Progress
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">${totalEarnings.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">Total Earned</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{totalTasksCompleted}</p>
              <p className="text-xs text-muted-foreground">Tasks Done</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{totalComputeSessions}</p>
              <p className="text-xs text-muted-foreground">Compute Sessions</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{formatDuration(totalComputeMinutes)}</p>
              <p className="text-xs text-muted-foreground">Compute Time</p>
            </div>
          </div>
        </div>

        {/* Live Status */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Live Status
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">CPU Usage</span>
                {activeComputeSession && (
                  <Badge variant="secondary" className="text-xs">Active</Badge>
                )}
              </div>
              <span className="text-sm font-medium">{currentCpuUsage}%</span>
            </div>
            <Progress value={currentCpuUsage} className="h-2" />
          </div>
        </div>

        {/* Education Impact */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Education Impact
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-secondary/10 rounded-lg">
              <DollarSign className="h-5 w-5 text-secondary" />
              <div>
                <p className="font-semibold">${educationFundContribution.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Contributed to Education</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-secondary/10 rounded-lg">
              <Users className="h-5 w-5 text-secondary" />
              <div>
                <p className="font-semibold">{studentsImpacted}</p>
                <p className="text-xs text-muted-foreground">Students Impacted</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
            <Globe className="h-3 w-3" />
            15% of your earnings automatically fund African education initiatives
          </p>
        </div>

        {/* Task Context */}
        <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
          <p className="text-sm font-medium text-primary mb-1">Current Impact</p>
          <p className="text-xs text-muted-foreground">
            Your contributions today are helping improve speech recognition for African accents 
            and supporting {studentsImpacted} students' educational journey.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
