"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/datarand";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Cpu, HardDrive, Zap } from "lucide-react";

interface NetworkStats {
  active_nodes: number;
  total_ram_gb: number;
  total_cpu_cores: number;
  total_storage_gb: number;
  total_compute_score: number;
}

export function NetworkStats() {
  const [stats, setStats] = useState<NetworkStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.getNetworkStats();
        setStats(response.data);
      } catch (error) {
        console.error('Failed to fetch network stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  if (loading || !stats) return null;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Network Power
        </CardTitle>
        <CardDescription>
          Real-time distributed compute across Africa
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <Activity className="h-3 w-3" />
              Active Nodes
            </div>
            <p className="text-2xl font-bold">{stats.active_nodes.toLocaleString()}</p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <Cpu className="h-3 w-3" />
              CPU Cores
            </div>
            <p className="text-2xl font-bold">{stats.total_cpu_cores.toLocaleString()}</p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <HardDrive className="h-3 w-3" />
              RAM (GB)
            </div>
            <p className="text-2xl font-bold">{Math.round(stats.total_ram_gb).toLocaleString()}</p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <Zap className="h-3 w-3" />
              Compute Score
            </div>
            <p className="text-2xl font-bold">{Math.round(stats.total_compute_score).toLocaleString()}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
