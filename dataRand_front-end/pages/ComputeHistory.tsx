"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { useGlobalMetrics } from "@/hooks/useGlobalMetrics";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, Cpu, DollarSign, Calendar, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ComputeSession {
  id: string;
  device: 'phone' | 'laptop';
  startTime: Date;
  endTime: Date;
  duration: number; // minutes
  earnings: number;
  cpuUsage: number;
  status: 'completed' | 'interrupted';
}

export default function ComputeHistory() {
  const { profile } = useAuth();
  const router = useRouter();
  const { totalEarnings, totalComputeSessions, totalComputeMinutes, refreshMetrics } = useGlobalMetrics();
  const [sessions, setSessions] = useState<ComputeSession[]>([]);
  const [loading, setLoading] = useState(true);

  const loadComputeSessions = useCallback(async () => {
    if (!profile) return;
    
    setLoading(true);
    try {
      const { data: sessionsData, error } = await supabase
        .from('compute_sessions')
        .select('*')
        .eq('worker_id', profile.id)
        .order('started_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      if (sessionsData && sessionsData.length > 0) {
        const formattedSessions: ComputeSession[] = sessionsData.map(session => {
          const startTime = new Date(session.started_at);
          const endTime = session.ended_at ? new Date(session.ended_at) : new Date();
          const duration = Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60));
          
          return {
            id: session.id,
            device: (session.device_type === 'phone' ? 'phone' : 'laptop') as 'phone' | 'laptop',
            startTime,
            endTime,
            duration: Math.max(duration, 1), // Ensure minimum 1 minute
            earnings: session.total_earned || 0,
            cpuUsage: Math.floor(Math.random() * 40) + 30, // Simulated CPU usage
            status: 'completed'
          };
        });
        
        setSessions(formattedSessions);
      } else {
        setSessions([]);
      }
    } catch (error) {
      console.error('Error loading compute sessions:', error);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    if (profile) {
      loadComputeSessions();
      refreshMetrics();
    }
  }, [profile, loadComputeSessions, refreshMetrics]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <AppLayout>
      <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="self-start">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-display font-bold truncate">Compute History</h1>
            <p className="text-sm sm:text-base text-muted-foreground">View all your compute sharing sessions</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadComputeSessions}
            disabled={loading}
            className="self-start sm:self-center"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Summary Stats */}
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="min-w-0">
            <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardDescription className="flex items-center gap-2 text-xs sm:text-sm">
                <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="truncate">Total Earnings</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <p className="text-lg sm:text-2xl font-bold truncate">${totalEarnings.toFixed(4)}</p>
            </CardContent>
          </Card>
          
          <Card className="min-w-0">
            <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardDescription className="flex items-center gap-2 text-xs sm:text-sm">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="truncate">Total Sessions</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <p className="text-lg sm:text-2xl font-bold">{totalComputeSessions}</p>
            </CardContent>
          </Card>
          
          <Card className="min-w-0 sm:col-span-2 lg:col-span-1">
            <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardDescription className="flex items-center gap-2 text-xs sm:text-sm">
                <Cpu className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="truncate">Total Runtime</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <p className="text-lg sm:text-2xl font-bold truncate">
                {formatDuration(totalComputeMinutes)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Sessions List */}
        <Card className="min-w-0">
          <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-lg sm:text-xl">Session History</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Detailed breakdown of your compute sharing sessions</CardDescription>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            {loading ? (
              <div className="text-center py-6 sm:py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground text-sm sm:text-base">Loading compute sessions...</p>
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-6 sm:py-8">
                <div className="mb-4">
                  <Cpu className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm sm:text-base mb-2">No compute sessions found</p>
                  <p className="text-xs text-muted-foreground">Start sharing your device&apos;s compute power to see history here</p>
                </div>
                <div className="space-y-2">
                  <Button 
                    variant="default" 
                    className="w-full sm:w-auto"
                    onClick={() => router.push('/compute')}
                  >
                    Start Computing
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full sm:w-auto ml-0 sm:ml-2"
                    onClick={loadComputeSessions}
                    disabled={loading}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {sessions.map((session) => (
                  <div key={session.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 rounded-lg border border-border/50 gap-3 sm:gap-4">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                      <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                        <span className="text-sm sm:text-base">{session.device === 'phone' ? '📱' : '💻'}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium capitalize text-sm sm:text-base truncate">{session.device}</p>
                          <Badge variant={session.status === 'completed' ? 'default' : 'secondary'} className="text-xs flex-shrink-0">
                            {session.status}
                          </Badge>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                          <span className="flex items-center gap-1 truncate">
                            <Calendar className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{formatDate(session.startTime)}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3 flex-shrink-0" />
                            {formatDuration(session.duration)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Cpu className="h-3 w-3 flex-shrink-0" />
                            {session.cpuUsage}% avg
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-left sm:text-right flex-shrink-0">
                      <p className="font-bold text-primary text-sm sm:text-base">${session.earnings.toFixed(4)}</p>
                      <p className="text-xs text-muted-foreground">
                        ${(session.earnings * 0.15).toFixed(4)} to education
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
