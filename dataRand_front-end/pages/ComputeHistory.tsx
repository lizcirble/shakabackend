"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, Cpu, DollarSign, Calendar } from "lucide-react";

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
  const [sessions, setSessions] = useState<ComputeSession[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);

  useEffect(() => {
    // Simulate compute history data
    const mockSessions: ComputeSession[] = [
      {
        id: '1',
        device: 'laptop',
        startTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        endTime: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        duration: 60,
        earnings: 0.06,
        cpuUsage: 45,
        status: 'completed'
      },
      {
        id: '2',
        device: 'phone',
        startTime: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        endTime: new Date(Date.now() - 3.5 * 60 * 60 * 1000), // 3.5 hours ago
        duration: 30,
        earnings: 0.03,
        cpuUsage: 32,
        status: 'completed'
      },
      {
        id: '3',
        device: 'laptop',
        startTime: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        endTime: new Date(Date.now() - 22 * 60 * 60 * 1000), // 22 hours ago
        duration: 120,
        earnings: 0.12,
        cpuUsage: 52,
        status: 'completed'
      }
    ];
    
    setSessions(mockSessions);
    setTotalEarnings(mockSessions.reduce((sum, session) => sum + session.earnings, 0));
  }, []);

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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-display font-bold">Compute History</h1>
            <p className="text-muted-foreground">View all your compute sharing sessions</p>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Total Earnings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">${totalEarnings.toFixed(4)}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Total Sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{sessions.length}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Cpu className="h-4 w-4" />
                Total Runtime
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {formatDuration(sessions.reduce((sum, session) => sum + session.duration, 0))}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Sessions List */}
        <Card>
          <CardHeader>
            <CardTitle>Session History</CardTitle>
            <CardDescription>Detailed breakdown of your compute sharing sessions</CardDescription>
          </CardHeader>
          <CardContent>
            {sessions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No compute sessions yet</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => router.push('/compute')}
                >
                  Start Computing
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {sessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-4 rounded-lg border border-border/50">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-primary/10">
                        {session.device === 'phone' ? '📱' : '💻'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium capitalize">{session.device}</p>
                          <Badge variant={session.status === 'completed' ? 'default' : 'secondary'}>
                            {session.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(session.startTime)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDuration(session.duration)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Cpu className="h-3 w-3" />
                            {session.cpuUsage}% avg
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">${session.earnings.toFixed(4)}</p>
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
