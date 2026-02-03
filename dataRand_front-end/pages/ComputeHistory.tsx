"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { useGlobalMetrics } from "@/hooks/useGlobalMetrics";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, Cpu, DollarSign, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DataSeeder } from "@/components/dev/DataSeeder";

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

  useEffect(() => {
    const loadComputeSessions = async () => {
      if (!profile) return;
      
      setLoading(true);
      try {
        const { data: sessionsData, error } = await supabase
          .from('compute_sessions')
          .select('*')
          .eq('worker_id', profile.id)
          .order('started_at', { ascending: false });

        if (error) throw error;

        if (sessionsData) {
          const formattedSessions: ComputeSession[] = sessionsData.map(session => {
            const startTime = new Date(session.started_at);
            const endTime = session.ended_at ? new Date(session.ended_at) : new Date();
            const duration = Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60));
            
            return {
              id: session.id,
              device: (session.device_type === 'phone' ? 'phone' : 'laptop') as 'phone' | 'laptop',
              startTime,
              endTime,
              duration,
              earnings: session.total_earned,
              cpuUsage: Math.floor(Math.random() * 40) + 30, // Simulated CPU usage
              status: session.is_active ? 'interrupted' : 'completed'
            };
          });
          
          setSessions(formattedSessions);
        }
      } catch (error) {
        console.error('Error loading compute sessions:', error);
        // Fallback to empty array
        setSessions([]);
      } finally {
        setLoading(false);
      }
    };

    loadComputeSessions();
    // Also refresh global metrics to ensure consistency
    refreshMetrics();
  }, [profile, refreshMetrics]);

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
        </div>

        {/* Development Data Seeder */}
        {process.env.NODE_ENV === 'development' && <DataSeeder />}

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
                <p className="text-muted-foreground text-sm sm:text-base">Loading sessions...</p>
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-6 sm:py-8">
                <p className="text-muted-foreground text-sm sm:text-base">No compute sessions yet</p>
                <Button 
                  variant="outline" 
                  className="mt-4 w-full sm:w-auto"
                  onClick={() => router.push('/compute')}
                >
                  Start Computing
                </Button>
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
